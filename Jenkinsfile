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
        stage('Unit Tests') {
            parallel {
                stage('Backend') {
                    agent { docker { image 'python:3.12-slim'; reuseNode true } }
                    steps {
                        script { 
                            env.FAILED_STAGE = "Backend Unit Tests" 
                            sh '''
                                python -m venv venv
                                . venv/bin/activate
                                pip install --no-cache-dir -r backend/requirements.txt
                                PYTHONPATH=backend ./venv/bin/python -m pytest -v -s -o junit_logging=all \
                                --junitxml=reports/unit-report.xml \
                                --cov=app --cov-report=xml:reports/coverage.xml \
                                backend/app/tests_unit
                            '''
                        }
                    }
                }
                stage('Frontend') {
                    agent { docker { image 'node:20-alpine'; reuseNode true } }
                    steps {
                        script { 
                            env.FAILED_STAGE = "Frontend Unit Tests" 
                            UnitFrontend()
                            sh "cp frontend/reports/frontend-report.xml reports/ || true"
                        }
                    }
                }
            }
        }
        stage('Version Calcutation') {
            steps {
                script { env.FAILED_STAGE = "Initialize" }
                sh "mkdir -p reports"
                sshagent([env.GIT_CREDS_ID]) {
                    script {
                        sh 'git fetch --tags'
                        def latestGitTag = sh(script: 'git describe --tags --abbrev=0 2>/dev/null || echo v1.0.0', returnStdout: true).trim().replace('v', '')
                        def latestEcrTag = getEcrTag()
                        
                        env.APP_IMAGE_TAG = calculateNextVersion(latestGitTag, latestEcrTag)
                        env.GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                        
                        echo "Version Comparison: git ${latestGitTag} | ecr ${latestEcrTag} | next version ${env.APP_IMAGE_TAG}"
                        echo "Commit: ${env.GIT_SHA}"
                    }
                }
            }
        }


        stage('Docker Build') {
            steps {
                script { 
                    env.FAILED_STAGE = "Docker Build"
                    docker.build("${APP_IMAGE_NAME}:${APP_IMAGE_TAG}", "--build-arg VERSION=${env.APP_IMAGE_TAG} --build-arg GIT_SHA=${env.GIT_SHA} .")
                }
            }
        }

        stage('Integration tests') {
            steps {
                script { env.FAILED_STAGE = "Integration Tests" }
                withCredentials([file(credentialsId: 'env-creds-menusync', variable:'SECRET_FILE')]) {
                    IntegrationTests()
                }
            }
        }

        stage('E2E tests') {
            steps {
                script { env.FAILED_STAGE = "E2E Tests" }
                withCredentials([file(credentialsId: 'env-creds-menusync', variable:'SECRET_FILE')]) {
                    e2eTests()
                }
            }
        }

        stage('Publish to ecr') {
            when { branch 'main' }
            steps {
                script { env.FAILED_STAGE = "Release & Deploy" 

                    sh "docker tag ${APP_IMAGE_NAME}:${APP_IMAGE_TAG} ${ECR_IMAGE}:${APP_IMAGE_TAG}"

                    docker.withRegistry("https://${env.ECR_REGISTRY}", "ecr:${env.AWS_REGION}:ecr-aws-creds") {  
                        script {
                            def img = docker.image("${ECR_IMAGE}:${APP_IMAGE_TAG}")
                            img.push()
                            img.push("sha-${env.GIT_SHA}")
                        }
                    }
                }
            }
        }

        stage('Vulnerability Scan') {
            when { branch 'main' }
            steps {
                script {
                    env.FAILED_STAGE = "Vulnerability Scan"
                    checkEcrScanFindings(env.APP_IMAGE_TAG)
                }
            }
        }

        stage('Git Tag'){
            steps{
                script{
                        env.FAILED_STAGE = "Git Tag"
                        sshagent([env.GIT_CREDS_ID]) {
                            sh "git tag -f v${env.APP_IMAGE_TAG} && git push origin v${env.APP_IMAGE_TAG} --force"
                        }
                }
            }
            
        }

        stage('Gitops update'){
            steps{
                script{
                    env.FAILED_STAGE = "Gitops update"
                    sshagent([env.GIT_CREDS_ID]) {
                        GitopsImageUpdate()
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                // Collect results with Console Log inclusion (keepLongStdio)
                if (findFiles(glob: 'reports/*.xml')) {
                    junit keepLongStdio: true, testResults: 'reports/*.xml'
                }
                
                if (findFiles(glob: 'reports/htmlcov/index.html')) {
                    publishHTML([
                        allowMissing: true, alwaysLinkToLastBuild: true,
                        reportDir: 'reports/htmlcov', reportFiles: 'index.html',
                        reportName: 'Unit Test Coverage'
                    ])
                }
            }
            sh '''
                docker compose down -v --remove-orphans || true
                docker image prune -f || true
            '''
            cleanWs()
        }
        success { sendSlack('SUCCESS', '#1E90FF') }
        unstable { sendSlack('WARNING', '#FF8C00') }
        failure { sendSlack('FAILURE', '#FF0000') }
    }
}

/** HELPER FUNCTIONS **/


def UnitFrontend(){
    dir('frontend') {
        sh 'npm install'
        sh 'npm test -- --reporter=verbose'
    }
}



def UnitBackend(){
    sh """
        PYTHONPATH=backend python -m pytest -v -s -o junit_logging=all \
        --junitxml=reports/unit-report.xml \
        --cov=app --cov-report=xml:reports/coverage.xml \
        backend/app/tests_unit
    """
}



def IntegrationTests(){
    sh '''
        export ENV_FILE="$SECRET_FILE"
        docker compose up -d
        docker compose exec -T app python seed.py
        
        docker compose --profile test run \
        --name integration-runner-${BUILD_ID} \
        -e PYTEST_ADDOPTS="-v -s -o junit_logging=all --junitxml=/reports/integration-report.xml" \
        tester pytest --ignore=tests/test_e2e.py --ignore=tests/test_e2e_admin_manager_flow.py
    '''
}


def e2eTests(){
    sh '''
        export ENV_FILE="$SECRET_FILE"
        docker compose --profile test run \
        --name e2e-runner-${BUILD_ID} \
        -e PYTEST_ADDOPTS="-v -s -o junit_logging=all --junitxml=/reports/e2e-report.xml" \
        tester pytest tests/test_e2e.py tests/test_e2e_admin_manager_flow.py
    '''
}



def getEcrTag() {
    def tag = "1.0.0"
    docker.image('amazon/aws-cli').inside('--entrypoint=""') {
        tag = sh(script: "aws ecr describe-images --repository-name $ECR_REPO --region $AWS_REGION --query 'sort_by(imageDetails, &imagePushedAt)[-1].imageTags' --output text | tr '\\t' '\\n' | grep -E '^[0-9]+\\.[0-9]+\\.[0-9]+\$' | sort -V | tail -n 1 || echo 1.0.0", returnStdout: true).trim()
    }
    return tag
}

def checkEcrScanFindings(tag) {
    docker.image('amazon/aws-cli').inside('--entrypoint=""') {
        echo "Triggering ECR scan for version ${tag}..."
        sh "aws ecr start-image-scan --repository-name $ECR_REPO --image-id imageTag=$tag --region $AWS_REGION || true"
        
        echo "Waiting for ECR scan to complete..."
        sh "aws ecr wait image-scan-complete --repository-name $ECR_REPO --image-id imageTag=$tag --region $AWS_REGION"
        
        def criticals = sh(script: "aws ecr describe-image-scan-findings --repository-name $ECR_REPO --image-id imageTag=$tag --region $AWS_REGION --query 'imageScanFindings.findingSeverityCounts.CRITICAL' --output text", returnStdout: true).trim()
        
        if (criticals != 'None' && criticals != '0') {
            error "Security Stop: ${criticals} CRITICAL vulnerabilities found in ECR image!"
        }
        echo "ECR Scan passed: 0 CRITICAL vulnerabilities found."
    }
}

def calculateNextVersion(gitTag, ecrTag) {
    def g = gitTag.tokenize('.').collect { it.toInteger() }
    def e = ecrTag.tokenize('.').collect { it.toInteger() }
    def major = Math.max(g[0], e[0])
    def minor = Math.max(g[1], e[1])
    def patch = (g[0] > e[0] || (g[0] == e[0] && g[1] > e[1])) ? g[2] : Math.max(g[2], e[2])
    return "${major}.${minor}.${patch + 1}"
}

def sendSlack(status, color) {
    def duration = currentBuild.durationString.replace(' and counting', '')
    def emoji = status == 'SUCCESS' ? ':white_check_mark:' : (status == 'WARNING' ? ':warning:' : ':x:')
    def failedStageInfo = (status == 'FAILURE' || status == 'WARNING') ? "\n> *Failed at Stage:* ${env.FAILED_STAGE}" : ""
    
    slackSend(color: color, channel: env.SLACK_CH, message: """
            ${emoji} *${status}*: ${env.JOB_NAME} [build #${env.BUILD_NUMBER}]
            > *Version:* ${env.APP_IMAGE_TAG ?: 'N/A'}
            > *Commit:* ${env.GIT_SHA ?: 'N/A'}
            > *Duration:* ${duration}${failedStageInfo}
            > *Build URL:* ${env.BUILD_URL}
            """.stripIndent())
            
}

def GitopsImageUpdate() {
    sh """
        git config user.email 'jenkins@yourdomain.com'
        git config user.name 'Jenkins CD Bot'
        rm -rf menusync-gitops-repo
        git clone git@gitlab.com:dencool/menusync-gitops-repo.git
        cd menusync-gitops-repo
        sed -i '/deployment:/,/tag:/ s/tag: .*/tag: "${env.APP_IMAGE_TAG}"/' apps-config/menusync/values.yaml
        git add .
        git commit -m "chore: version bump to ${env.APP_IMAGE_TAG}"
        git push origin main
    """
}
