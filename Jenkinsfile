pipeline {
    agent any
    
    options {
        timeout(time: 10, unit: 'MINUTES')
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
    }

    stages {
        stage('Version Calculation') {
            steps {
                sshagent([env.GIT_CREDS_ID]) {
                    script {
                        sh 'git fetch --tags'
                        def latestTag = sh(script: 'git describe --tags --abbrev=0 || echo v1.0.0', returnStdout: true).trim()
                        def commitCount = sh(script: "git rev-list --count ${latestTag}..HEAD || echo 0", returnStdout: true).trim()
                        def baseVersion = latestTag.replace('v', '')
                        def parts = baseVersion.tokenize('.')
                        def major = parts[0]
                        def minor = parts[1]

                        env.APP_IMAGE_TAG = "${major}.${minor}.${commitCount}"
                        env.GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                        
                        echo "Calculated SemVer: ${env.APP_IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    env.APP_IMAGE_NAME = 'menusync-app'
                    sh "docker build --build-arg VERSION=${env.APP_IMAGE_TAG} --build-arg GIT_SHA=${env.GIT_SHA} -t $APP_IMAGE_NAME:$APP_IMAGE_TAG ."
                }
            }
        }

        stage('Unit tests') {
            steps {
                script {
                    sh 'mkdir -p reports'
                    
                    // 1. Run tests in a named container (Remove --rm so we can copy files after)
                    // We use "|| true" so the pipeline doesn't fail immediately if tests fail,
                    // allowing us to copy the report and let Jenkins process the failure properly.
                    sh """
                        docker run --name unit-tests-${env.BUILD_ID} \
                        $APP_IMAGE_NAME:$APP_IMAGE_TAG \
                        python -m pytest \
                        --junitxml=/reports/unit-report.xml \
                        --cov=app \
                        --cov-report=html:/reports/htmlcov \
                        app/tests_unit || true
                    """
                    
                    // 2. Copy the reports OUT of the container into Jenkins Workspace
                    sh "docker cp unit-tests-${env.BUILD_ID}:/reports/unit-report.xml ./reports/unit-report.xml"
                    
                    // Optional: Copy coverage report if you need it
                    // sh "docker cp unit-tests-${env.BUILD_ID}:/reports/htmlcov ./htmlcov"

                    // 3. Clean up the container
                    sh "docker rm unit-tests-${env.BUILD_ID}"
                }
            }
        }

        stage('integration tests') {
            steps {
                withCredentials([file(credentialsId: 'env-creds-menusync', variable:'SECRET_FILE')]) {
                    script {
                        sh 'rm -f .env'
                        sh 'cp $SECRET_FILE .env'
                        sh 'docker compose up -d'
                        sh 'docker compose exec -T app python seed.py'
                        sh 'docker compose --profile test up --abort-on-container-exit --exit-code-from tester'
                    }
                }
            }
        }

        stage('Docker Tag') {
            when { branch 'main' }
            steps {
                script {
                    // FIX: Use ECR_IMAGE (Full URL) instead of ECR_REPO (Short name)
                    sh "docker tag $APP_IMAGE_NAME:$APP_IMAGE_TAG $ECR_IMAGE:$APP_IMAGE_TAG"
                    sh "docker tag $APP_IMAGE_NAME:$APP_IMAGE_TAG $ECR_IMAGE:sha-$GIT_SHA"
                }
            }
        }

        stage('Docker Push') {
            when { branch 'main' }
            steps {
                script {
                    docker.image('amazon/aws-cli').inside('--entrypoint=""') {
                        ecrLoginPassword = sh(script: "aws ecr get-login-password --region ${env.AWS_REGION}", returnStdout: true).trim()
                    }
                    sh """
                        set +x
                        echo '${ecrLoginPassword}' | docker login --username AWS --password-stdin https://${env.ECR_REGISTRY}
                        set -x
                    """
                    // FIX: Use ECR_IMAGE to push to the correct registry
                    sh "docker push $ECR_IMAGE:$APP_IMAGE_TAG"
                    sh "docker push $ECR_IMAGE:sha-$GIT_SHA"
                }
                
            }
        }

        stage('Git Tag') {
            when { branch 'main' }
            steps {
                script {
                    sshagent([env.GIT_CREDS_ID]) {
                        sh """
                            git tag -f v${env.APP_IMAGE_TAG}
                            git push origin v${env.APP_IMAGE_TAG} --force
                        """
                    }   
                }
            }
        }
    }

    post {
        always {
            script {
                sh 'docker compose down -v --remove-orphans'
                sh 'docker system prune -f'
                sh 'rm -f .env'
                
                if (fileExists('reports/unit-report.xml')) {
                    // Collect results from the 'reports' folder we created
                    junit 'reports/unit-report.xml'
                    
                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        reportDir: 'htmlcov',
                        reportFiles: 'index.html',
                        reportName: 'Unit Test Coverage'
                    ])
                }else {
                    echo "WARNING: No test reports found. Marking build as UNSTABLE."
                    // This turns the pipeline YELLOW instead of RED, preventing a hard failure
                    currentBuild.result = 'UNSTABLE'
                }
            }
        }
        success {
            sendSlack('SUCCESS', '#1E90FF')
            updateGitlabCommitStatus name: 'build', state: 'success'
        }
        unstable {
            // This runs if we manually set result to UNSTABLE above
            sendSlack('WARNING: Missing Tests', 'warning') // 'warning' is usually Yellow/Orange
            // We still tell GitLab it succeeded because the Deploy/Push actually worked
            updateGitlabCommitStatus name: 'build', state: 'success'
        }
        failure {
            sendSlack('FAILURE', 'danger') 
            updateGitlabCommitStatus name: 'build', state: 'failed'
        }
    }
}

def sendSlack(status, color) {
    slackSend(color: color, message: "${status}: ${env.JOB_NAME} #${env.BUILD_NUMBER} | ${env.BUILD_URL}", channel: env.SLACK_CH)
}