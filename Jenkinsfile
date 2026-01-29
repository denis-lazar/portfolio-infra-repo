pipeline {
    agent any
    
    options {
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
        gitLabConnection('GitLab-Public')
    }

    environment {
        COMPOSE_PROJECT_NAME = "menusync-${env.BUILD_ID}"
        SLACK_CH     = 'C0A1WAPDNVD'   
        AWS_REGION   = 'ap-south-1'
        ECR_REGISTRY = '685092162784.dkr.ecr.ap-south-1.amazonaws.com'
        ECR_REPO     = "menusync"
        ECR_IMAGE    = "${ECR_REGISTRY}/${ECR_REPO}"
        GIT_CREDS_ID = 'jenkins-ssh-gitlab'
        APP_IMAGE_NAME = 'menusync-app'
    }

    stages {
        stage('Version Calculation') {
            steps {
                sshagent([env.GIT_CREDS_ID]) {
                    script {
                        sh 'git fetch --tags'
                        // 1. Get latest version from Git
                        def latestGitTag = sh(script: 'git describe --tags --abbrev=0 || echo v1.0.0', returnStdout: true).trim().replace('v', '')
                        
                        // 2. Get latest version from ECR (Cloud Truth)
                        def latestEcrTag = "1.0.0"
                        docker.image('amazon/aws-cli').inside('--entrypoint=""') {
                            latestEcrTag = sh(script: """
                                aws ecr describe-images --repository-name $ECR_REPO \
                                --query 'sort_by(imageDetails, &imagePushedAt)[-1].imageTags' \
                                --output text | tr '\t' '\n' | grep -E '^[0-9]+\\.[0-9]+\\.[0-9]+$' | sort -V | tail -n 1 || echo 1.0.0
                            """, returnStdout: true).trim()
                        }

                        // 3. Logic: Pick the max of both and increment patch
                        def (gMajor, gMinor, gPatch) = latestGitTag.tokenize('.').collect { it.toInteger() }
                        def (eMajor, eMinor, ePatch) = latestEcrTag.tokenize('.').collect { it.toInteger() }
                        
                        def major = Math.max(gMajor, eMajor)
                        def minor = Math.max(gMinor, eMinor)
                        def patch = (gMajor == eMajor && gMinor == eMinor) ? Math.max(gPatch, ePatch) : (gMajor > eMajor || gMinor > eMinor ? gPatch : ePatch)

                        env.APP_IMAGE_TAG = "${major}.${minor}.${patch + 1}"
                        env.GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                        
                        echo "Git: ${latestGitTag} | ECR: ${latestEcrTag} | Result: ${env.APP_IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
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
                script {
                    sh 'mkdir -p reports'
                    sh """
                        python -m pytest \
                        --junitxml=reports/unit-report.xml \
                        --cov=app \
                        --cov-report=xml:reports/coverage.xml \
                        --cov-report=html:reports/htmlcov \
                        app/tests_unit || true
                    """
                }
            }
        }

        stage('Integration Tests') {
            steps {
                withCredentials([file(credentialsId: 'env-creds-menusync', variable:'SECRET_FILE')]) {
                    script {
                        // Using --env-file directly with the Jenkins secret file path
                        // ENV_FILE variable allows docker-compose.yml to find the secrets
                        def composeCmd = "ENV_FILE=${SECRET_FILE} docker compose --env-file ${SECRET_FILE}"
                        
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
                            sh "${composeCmd} down -v --remove-orphans"
                        }
                    }
                }
            }
        }

        stage('Docker Tag & Push') {
            when { branch 'main' }
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

        stage('ECR Image Scan') {
            when { branch 'main' }
            steps {
                script {
                    docker.image('amazon/aws-cli').inside('--entrypoint=""') {
                        sh """
                            echo "Waiting for ECR scan results for ${env.APP_IMAGE_TAG}..."
                            aws ecr wait image-scan-complete --repository-name ${ECR_REPO} --image-id imageTag=${env.APP_IMAGE_TAG}
                            
                            echo "Scan Findings Summary:"
                            aws ecr describe-image-scan-findings --repository-name ${ECR_REPO} --image-id imageTag=${env.APP_IMAGE_TAG} \
                            --query 'imageScanFindings.findingSeverityCounts' --output table
                        """
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
                if (findFiles(glob: 'reports/*.xml')) {
                    junit 'reports/*.xml'
                }
                
                if (findFiles(glob: 'reports/*.xml')) {
                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        reportDir: 'reports/htmlcov',
                        reportFiles: 'index.html',
                        reportName: 'Unit Test Coverage'
                    ])
                }else {
                    echo "WARNING: No test reports found. Marking build as UNSTABLE."
                    currentBuild.result = 'UNSTABLE'
                }
            }
            sh "docker rmi ${APP_IMAGE_NAME}:${APP_IMAGE_TAG} || true"
        }
        success { sendSlack('SUCCESS', '#1E90FF') }
        unstable {
            sendSlack('WARNING: Missing Tests', 'warning') 
            updateGitlabCommitStatus name: 'build', state: 'success'
        }
        failure { sendSlack('FAILURE', 'danger') }
    }
}

def sendSlack(status, color) {
    slackSend(color: color, message: "${status}: ${env.JOB_NAME} #${env.BUILD_NUMBER} | ${env.BUILD_URL}", channel: env.SLACK_CH)
}