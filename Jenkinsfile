pipeline {
    agent any
    
    options {
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
        gitLabConnection('GitLab-Public')
    }

    environment {
        COMPOSE_PROJECT_NAME = "menusync-${env.BUILD_ID}"
        SLACK_CH             = 'C0A1WAPDNVD'   
        AWS_REGION           = 'ap-south-1'
        ECR_REGISTRY         = '685092162784.dkr.ecr.ap-south-1.amazonaws.com'
        ECR_REPO             = "menusync"
        ECR_IMAGE            = "${ECR_REGISTRY}/${ECR_REPO}"
        GIT_CREDS_ID         = 'jenkins-ssh-gitlab'
        APP_IMAGE_NAME       = 'menusync-app'
    }

    stages {
        stage('Version Calculation') {
            steps {
                sshagent([env.GIT_CREDS_ID]) {
                    script {
                        sh 'git fetch --tags'
                        // 1. Get latest version from Git
                        def latestGitTag = sh(script: 'git describe --tags --abbrev=0 2>/dev/null || echo v1.0.0', returnStdout: true).trim().replace('v', '')
                        
                        // 2. Get latest version from ECR (Cloud Truth)
                        def latestEcrTag = "1.0.0"
                        docker.image('amazon/aws-cli').inside('--entrypoint=""') {
                            latestEcrTag = sh(script: """
                                aws ecr describe-images --repository-name $ECR_REPO --region $AWS_REGION \
                                --query 'sort_by(imageDetails, &imagePushedAt)[-1].imageTags' \
                                --output text | tr '\t' '\n' | grep -E '^[0-9]+\\.[0-9]+\\.[0-9]+\$' | sort -V | tail -n 1 || echo 1.0.0
                            """, returnStdout: true).trim()
                        }

                        // 3. Increment logic: Parse and compare
                        def gParts = latestGitTag.tokenize('.').collect { it.toInteger() }
                        def eParts = latestEcrTag.tokenize('.').collect { it.toInteger() }
                        
                        // Compare version lists [Major, Minor, Patch]
                        def maxVer = (gParts > eParts) ? gParts : eParts
                        
                        env.APP_IMAGE_TAG = "${maxVer[0]}.${maxVer[1]}.${maxVer[2] + 1}"
                        env.GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                        
                        echo "Double-Truth Versioning: Git(${latestGitTag}) vs ECR(${latestEcrTag}) -> Next: ${env.APP_IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    // Use the native docker.build for better integration
                    docker.build("${APP_IMAGE_NAME}:${APP_IMAGE_TAG}", "--build-arg VERSION=${env.APP_IMAGE_TAG} --build-arg GIT_SHA=${env.GIT_SHA} .")
                }
            }
        }

        stage('Unit Tests') {
            agent {
                docker {
                    image "${APP_IMAGE_NAME}:${APP_IMAGE_TAG}"
                    reuseNode true
                }
            }
            steps {
                // Workspace is mounted into the container automatically
                sh """
                    mkdir -p reports
                    python -m pytest \
                    --junitxml=reports/unit-report.xml \
                    --cov=app \
                    --cov-report=xml:reports/coverage.xml \
                    --cov-report=html:reports/htmlcov \
                    app/tests_unit || true
                """
            }
        }

        stage('Integration Tests') {
            steps {
                withCredentials([file(credentialsId: 'env-creds-menusync', variable:'SECRET_FILE')]) {
                    script {
                        def composeCmd = "ENV_FILE=${SECRET_FILE} docker compose --env-file ${SECRET_FILE}"
                        sh "mkdir -p reports"
                        
                        try {
                            sh "${composeCmd} up -d"
                            sh "${composeCmd} exec -T app python seed.py"
                            
                            sh """
                                ${composeCmd} --profile test run \
                                --name integration-runner-${env.BUILD_ID} \
                                -e PYTEST_ADDOPTS=\"-v -o junit_logging=all --junitxml=/reports/integration-report.xml\" \
                                tester
                            """
                        } catch (Exception e) {
                            echo "Integration tests failed: ${e.message}"
                        } finally {
                            sh "docker cp integration-runner-${env.BUILD_ID}:/reports/integration-report.xml ./reports/integration-report.xml || true"
                            sh "docker rm integration-runner-${env.BUILD_ID} || true"
                            sh "${composeCmd} down -v --remove-orphans"
                        }
                    }
                }
            }
        }

        stage('Push & Scan') {
            when { branch 'main' }
            stages {
                stage('Push to ECR') {
                    steps {
                        script {
                            docker.withRegistry("https://${env.ECR_REGISTRY}", "ecr:${env.AWS_REGION}:jenkins-aws-creds") {
                                def img = docker.image("${APP_IMAGE_NAME}:${APP_IMAGE_TAG}")
                                img.push()
                                img.push("sha-${env.GIT_SHA}")
                            }
                        }
                    }
                }
                stage('Vulnerability Scan') {
                    steps {
                        docker.image('amazon/aws-cli').inside('--entrypoint=""') {
                            sh """
                                echo "Waiting for ECR scan results..."
                                aws ecr wait image-scan-complete --repository-name ${ECR_REPO} --image-id imageTag=${env.APP_IMAGE_TAG} --region ${env.AWS_REGION}
                                aws ecr describe-image-scan-findings --repository-name ${ECR_REPO} --image-id imageTag=${env.APP_IMAGE_TAG} --region ${env.AWS_REGION} \
                                --query 'imageScanFindings.findingSeverityCounts' --output table
                            """
                        }
                    }
                }
            }
        }

        stage('Git Tag') {
            when { branch 'main' }
            steps {
                sshagent([env.GIT_CREDS_ID]) {
                    sh """
                        git tag -f v${env.APP_IMAGE_TAG}
                        git push origin v${env.APP_IMAGE_TAG} --force
                    """
                }
            }
        }
    }

    post {
        always {
            script {
                // Collect results
                if (findFiles(glob: 'reports/*.xml')) {
                    junit 'reports/*.xml'
                }
                
                if (findFiles(glob: 'reports/htmlcov/index.html')) {
                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        reportDir: 'reports/htmlcov',
                        reportFiles: 'index.html',
                        reportName: 'Unit Test Coverage'
                    ])
                } else {
                    echo "WARNING: No test reports found. Marking build as UNSTABLE."
                    currentBuild.result = 'UNSTABLE'
                }
            }
            // Cleanup local image to save disk space
            sh "docker rmi ${APP_IMAGE_NAME}:${APP_IMAGE_TAG} || true"
        }
        success { sendSlack('SUCCESS', '#1E90FF') }
        unstable { sendSlack('WARNING: Check Tests', 'warning') }
        failure { sendSlack('FAILURE', 'danger') }
    }
}

def sendSlack(status, color) {
    slackSend(color: color, message: "${status}: ${env.JOB_NAME} #${env.BUILD_NUMBER} | ${env.BUILD_URL}", channel: env.SLACK_CH)
}