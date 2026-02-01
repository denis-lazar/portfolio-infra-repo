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
                script { env.FAILED_STAGE = "Version Calculation" }
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
                                --output text | tr '\t' '\n' | grep -E '^[0-9]+\\.[0-9]+\\.[0-9]+$' | sort -V | tail -n 1 || echo 1.0.0
                            """, returnStdout: true).trim()
                        }

                        // 3. Increment logic: Parse and compare
                        def g = latestGitTag.tokenize('.').collect { it.toInteger() }
                        def e = latestEcrTag.tokenize('.').collect { it.toInteger() }
                        
                        // Compare Major.Minor.Patch manually (Sandbox friendly)
                        def major = Math.max(g[0], e[0])
                        def minor = Math.max(g[1], e[1])
                        def patch
                        
                        if (g[0] > e[0]) {
                            patch = g[2]
                        } else if (e[0] > g[0]) {
                            patch = e[2]
                        } else {
                            // Majors are equal, check Minors
                            if (g[1] > e[1]) {
                                patch = g[2]
                            } else if (e[1] > g[1]) {
                                patch = e[2]
                            } else {
                                // Majors and Minors are equal, check Patches
                                patch = Math.max(g[2], e[2])
                            }
                        }
                        
                        env.APP_IMAGE_TAG = "${major}.${minor}.${patch + 1}"
                        env.GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                        
                        echo "Double-Truth Versioning: Git(${latestGitTag}) vs ECR(${latestEcrTag}) -> Next: ${env.APP_IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                script { 
                    env.FAILED_STAGE = "Docker Build"
                    // Use the native docker.build for better integration
                    docker.build("${APP_IMAGE_NAME}:${APP_IMAGE_TAG}", "--build-arg VERSION=${env.APP_IMAGE_TAG} --build-arg GIT_SHA=${env.GIT_SHA} .")
                }
            }
        }

        stage('Setup Reports') {
            steps {
                script { env.FAILED_STAGE = "Setup Reports" }
                sh "mkdir -p reports"
            }
        }

        stage('Unit Tests') {
            parallel {
                stage('Backend Unit Tests') {
                    agent {
                        docker {
                            image "${APP_IMAGE_NAME}:${APP_IMAGE_TAG}"
                            reuseNode true
                        }
                    }
                    steps {
                        script { env.FAILED_STAGE = "Unit Tests (Backend)" }
                        sh """
                            mkdir -p reports
                            PYTHONPATH=backend python -m pytest -v \
                            --junitxml=reports/unit-report.xml \
                            --cov=app \
                            --cov-report=xml:reports/coverage.xml \
                            --cov-report=html:reports/htmlcov \
                            backend/app/tests_unit
                            
                            echo "--- BACKEND UNIT TEST RESULTS ---"
                            cat reports/unit-report.xml || true
                        """
                    }
                }
                stage('Frontend Unit Tests') {
                    agent {
                        docker {
                            image 'node:20-alpine'
                            reuseNode true
                        }
                    }
                    steps {
                        script { 
                            env.FAILED_STAGE = "Unit Tests (Frontend)"
                            try {
                                sh """
                                    cd frontend
                                    npm install
                                    npm test
                                """
                            } finally {
                                sh """
                                    mkdir -p reports
                                    cp frontend/reports/frontend-report.xml reports/ || true
                                    echo "--- FRONTEND TEST RESULTS ---"
                                    cat reports/frontend-report.xml || true
                                """
                            }
                        }
                    }
                }
            }
        }

        stage('Integration Tests') {
            steps {
                script { env.FAILED_STAGE = "Integration Tests" }
                withCredentials([file(credentialsId: 'env-creds-menusync', variable:'SECRET_FILE')]) {
                    script {
                        sh "mkdir -p reports"
                        
                        try {
                            sh '''
                                export ENV_FILE=$SECRET_FILE
                                docker compose --env-file $SECRET_FILE up -d
                                docker compose --env-file $SECRET_FILE exec -T app python seed.py
                                
                                docker compose --env-file $SECRET_FILE --profile test run \
                                --name integration-runner-${BUILD_ID} \
                                -e PYTEST_ADDOPTS="-v -o junit_logging=all --junitxml=/reports/integration-report.xml" \
                                tester
                            '''
                        } catch (Exception e) {
                            echo "Integration tests failed: ${e.message}"
                        } finally {
                            sh '''
                                docker cp integration-runner-${BUILD_ID}:/reports/integration-report.xml ./reports/integration-report.xml || true
                                docker rm -f integration-runner-${BUILD_ID} || true
                                docker compose --env-file $SECRET_FILE down -v --remove-orphans
                            '''
                        }
                    }
                }
            }
        }

        stage('Push to ECR') {
            when { branch 'main' }
            steps {
                script {
                    env.FAILED_STAGE = "Push to ECR"
                    sh "docker tag ${APP_IMAGE_NAME}:${APP_IMAGE_TAG} ${ECR_IMAGE}:${APP_IMAGE_TAG}"

                    docker.withRegistry("https://${env.ECR_REGISTRY}", "ecr:${env.AWS_REGION}:ecr-aws-creds") {  

                        def img = docker.image("${ECR_IMAGE}:${APP_IMAGE_TAG}")
                        img.push()
                        img.push("sha-${env.GIT_SHA}")
                    }
                }
            }
        }
        stage('ECR Scan') {
            when { branch 'main' }
            steps { 
                script {
                    env.FAILED_STAGE = "ECR Scan"
                    docker.image('amazon/aws-cli').inside('--entrypoint=""') {
                        sh """
                            echo "1. Starting ECR vulnerability scan..."
                            aws ecr start-image-scan --repository-name ${ECR_REPO} --image-id imageTag=${env.APP_IMAGE_TAG} --region ${env.AWS_REGION} || echo "Scan in progress"

                            echo "2. Waiting for results..."
                            aws ecr wait image-scan-complete --repository-name ${ECR_REPO} --image-id imageTag=${env.APP_IMAGE_TAG} --region ${env.AWS_REGION}
                            
                            echo "3. SCAN REPORT (High/Critical only):"
                            # This command lists the actual package names and CVE IDs causing the High alerts
                            aws ecr describe-image-scan-findings --repository-name ${ECR_REPO} --image-id imageTag=${env.APP_IMAGE_TAG} --region ${env.AWS_REGION} \
                            --query "imageScanFindings.findings[?severity=='HIGH' || severity=='CRITICAL'].[name, attributes[?key=='package_version']|[0].value, uri]" --output text

                            echo "4. Checking Quality Gate..."
                            # Get the count of High/Critical vulnerabilities
                            CRITICAL_COUNT=\$(aws ecr describe-image-scan-findings --repository-name ${ECR_REPO} --image-id imageTag=${env.APP_IMAGE_TAG} --region ${env.AWS_REGION} --query "imageScanFindings.findingSeverityCounts.CRITICAL" --output text)
                            HIGH_COUNT=\$(aws ecr describe-image-scan-findings --repository-name ${ECR_REPO} --image-id imageTag=${env.APP_IMAGE_TAG} --region ${env.AWS_REGION} --query "imageScanFindings.findingSeverityCounts.HIGH" --output text)

                            # Convert 'None' to 0 (AWS returns 'None' if count is 0)
                            if [ "\$CRITICAL_COUNT" = "None" ]; then CRITICAL_COUNT=0; fi
                            if [ "\$HIGH_COUNT" = "None" ]; then HIGH_COUNT=0; fi

                            echo "Found \$CRITICAL_COUNT Critical and \$HIGH_COUNT High vulnerabilities."

                            # FAIL the pipeline if there are any severe issues
                            if [ "\$CRITICAL_COUNT" -gt 0 ] || [ "\$HIGH_COUNT" -gt 0 ]; then
                                echo " FAILURE: Security Quality Gate Failed. Critical/High vulnerabilities detected."
                                exit 1
                            else
                                echo " SUCCESS: Image passed security scan."
                            fi
                        """
                    }
                }
            }
        }
            
        

        stage('Git Tag') {
            when { branch 'main' }
            steps {
                script { env.FAILED_STAGE = "Git Tagging" }
                sshagent([env.GIT_CREDS_ID]) {
                    sh """
                        git tag -f v${env.APP_IMAGE_TAG}
                        git push origin v${env.APP_IMAGE_TAG} --force
                    """
                }
            }
        }


        stage('Gitops Update'){
            when{branch 'main'}
            steps{
                script { env.FAILED_STAGE = "GitOps Update" }
                sshagent([env.GIT_CREDS_ID]){


                    GitopsImageUpdate()
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
                    // Check if we are in calculation stage where tests aren't expected yet
                    if (env.FAILED_STAGE != "Version Calculation" && env.FAILED_STAGE != "Docker Build") {
                        currentBuild.result = 'UNSTABLE'
                    }
                }
            }
            // Cleanup local image to save disk space
            sh "docker image prune -f || true"
        }
        success { sendSlack('SUCCESS', '#1E90FF') }
        unstable { sendSlack('WARNING', '#FF8C00') }
        failure { sendSlack('FAILURE', '#FF0000') }
    }
}

def sendSlack(status, color) {
    def duration = currentBuild.durationString.replace(' and counting', '')
    def emoji = status == 'SUCCESS' ? ':white_check_mark:' : (status == 'WARNING' ? ':warning:' : ':x:')
    
    def failedStageInfo = (status == 'FAILURE' || status == 'WARNING') ? "\n> *Failed at Stage:* ${env.FAILED_STAGE}" : ""
    
    def message = """
${emoji} *${status}*: ${env.JOB_NAME} [build #${env.BUILD_NUMBER}]
> *Version:* ${env.APP_IMAGE_TAG ?: 'N/A'}
> *Commit:* ${env.GIT_SHA ?: 'N/A'}
> *Duration:* ${duration}${failedStageInfo}
> *Build URL:* ${env.BUILD_URL}
".stripIndent()

    slackSend(color: color, message: message, channel: env.SLACK_CH)
}


def GitopsImageUpdate(){
    sh """

           # 1. Identity
           git config user.email 'jenkins@yourdomain.com'
           git config user.name 'Jenkins CD Bot'

           # 2. Workspace Cleanup (Ensures no old files exist)
           rm -rf menusync-gitops-repo

           # 3. Action
           git clone git@gitlab.com:dencool/menusync-gitops-repo.git
           cd menusync-gitops-repo
           
           # 4. Search and replace version
           sed -i 's/tag: .*/tag: "${env.APP_IMAGE_TAG}"'/g' apps-config/menusync/values.yaml
           
           # 5. Commit and Push
           git add apps-config/menusync/values.yaml
           git commit -m "chore: automatic version bump to ${env.APP_IMAGE_TAG}"
           git push origin main
       """

}
