pipeline {
    agent any
    
    options {
        timeout(time: 10, unit: 'MINUTES')
        disableConcurrentBuilds()
        gitLabConnection('GitLab-Public')
    }

    environment {
        COMPOSE_PROJECT_NAME = "menusync-${env.BUILD_ID}"
        SLACK_CH = 'C0A1WAPDNVD'   
        AWS_REGION = 'ap-south-1' // Switched back to Mumbai
        ECR_REPO = "685092162784.dkr.ecr.${env.AWS_REGION}.amazonaws.com/menusync"
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
                    sh 'mkdir -p reports htmlcov && chmod 777 reports htmlcov'
                    sh """
                        docker run --rm -v ${WORKSPACE}:/reports $APP_IMAGE_NAME:$APP_IMAGE_TAG \
                        python -m pytest \
                        --junitxml=/reports/unit-report.xml \
                        --cov=app \
                        --cov-report=html:/reports/htmlcov \
                        app/tests_unit
                    """
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
                    // Using --network host to reach IMDS. 
                    // If this still fails with "Unable to locate credentials", we'll need to fix the IMDS Hop Limit on the EC2 instance.
                    def ecrPassword = sh(script: "docker run --rm --network host amazon/aws-cli ecr get-login-password --region ${env.AWS_REGION}", returnStdout: true).trim()
                    
                    sh "echo ${ecrPassword} | docker login --username AWS --password-stdin 685092162784.dkr.ecr.${env.AWS_REGION}.amazonaws.com"
                    
                    sh "docker tag $APP_IMAGE_NAME:$APP_IMAGE_TAG $ECR_REPO:$APP_IMAGE_TAG"
                    sh "docker tag $APP_IMAGE_NAME:$APP_IMAGE_TAG $ECR_REPO:sha-$GIT_SHA"
                }
            }
        }

        stage('Docker Push') {
            when { branch 'main' }
            steps {
                script {
                    sh "docker push $ECR_REPO:$APP_IMAGE_TAG"
                    sh "docker push $ECR_REPO:sha-$GIT_SHA"
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
                sh 'rm -f .env'
                
                // Collect results from the 'reports' folder we created
                junit 'reports/unit-report.xml'
                
                publishHTML([
                    allowMissing: true,
                    alwaysLinkToLastBuild: true,
                    reportDir: 'htmlcov',
                    reportFiles: 'index.html',
                    reportName: 'Unit Test Coverage'
                ])
            }
        }
        success {
            sendSlack('SUCCESS', '#1E90FF')
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