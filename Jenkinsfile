pipeline {
    agent any
    
    options {
        timeout(time: 15, unit: 'MINUTES')
        disableConcurrentBuilds()
        gitLabConnection('GitLab-Public')
    }

    environment {
        // Use a unique project name to prevent collisions between builds
        COMPOSE_PROJECT_NAME = "menusync-${env.BUILD_ID}"
        
        // Configuration
        SLACK_CH     = 'C0A1WAPDNVD'   
        AWS_REGION   = 'ap-south-1'
        ECR_REGISTRY = '685092162784.dkr.ecr.ap-south-1.amazonaws.com'
        ECR_REPO     = "menusync"
        ECR_IMAGE    = "${ECR_REGISTRY}/${ECR_REPO}"
        GIT_CREDS_ID = 'jenkins-ssh-gitlab'
        
        // Image constants
        APP_IMAGE_NAME = 'menusync-app'
    }

    stages {
        stage('Version Calculation') {
            steps {
                sshagent([env.GIT_CREDS_ID]) {
                    script {
                        sh 'git fetch --tags'
                        // Calculate SemVer based on git tags and commit history
                        def latestTag = sh(script: 'git describe --tags --abbrev=0 || echo v1.0.0', returnStdout: true).trim()
                        def commitCount = sh(script: "git rev-list --count ${latestTag}..HEAD || echo 0", returnStdout: true).trim()
                        def baseVersion = latestTag.replace('v', '')
                        def parts = baseVersion.tokenize('.')
                        
                        env.APP_IMAGE_TAG = "${parts[0]}.${parts[1]}.${commitCount}"
                        env.GIT_SHA = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                        
                        echo "Calculated SemVer: ${env.APP_IMAGE_TAG}"
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    sh "docker build --build-arg VERSION=${env.APP_IMAGE_TAG} --build-arg GIT_SHA=${env.GIT_SHA} -t $APP_IMAGE_NAME:$APP_IMAGE_TAG ."
                }
            }
        }

        stage('Unit Tests') {
            steps {
                script {
                    sh 'mkdir -p reports'
                    
                    // Run tests in a named container so we can copy reports out easily
                    // "|| true" prevents pipeline crash on test failure, allowing report processing
                    sh """
                        docker run --name unit-tests-${env.BUILD_ID} \
                        $APP_IMAGE_NAME:$APP_IMAGE_TAG \
                        python -m pytest \
                        --junitxml=/reports/unit-report.xml \
                        --cov=app \
                        --cov-report=html:/reports/htmlcov \
                        app/tests_unit || true
                    """
                    
                    // Extract reports and cleanup
                    sh "docker cp unit-tests-${env.BUILD_ID}:/reports/unit-report.xml ./reports/unit-report.xml"
                    sh "docker rm unit-tests-${env.BUILD_ID}"
                }
            }
        }

        stage('Integration Tests') {
            steps {
                withCredentials([file(credentialsId: 'env-creds-menusync', variable:'SECRET_FILE')]) {
                    script {

                        sh 'rm -f docker-compose.override.yml'
                        // 1. Prepare Environment
                        sh 'rm -f .env'
                        sh 'cp $SECRET_FILE .env'
                        
                        // 2. Start Dependencies (App + DB)
                        sh 'docker compose up -d'
                        sh 'docker compose exec -T app python seed.py'

                        // 3. Run Tests using 'docker compose run' (Cleaner than override files)
                        // We inject the pytest config directly via -e
                        try {
                            sh """
                                docker compose --profile test run \\
                                --name integration-runner-${env.BUILD_ID} \\
                                -e PYTEST_ADDOPTS="-v -o junit_logging=all --junitxml=/integration-report.xml" \\
                                tester
                            """
                        } catch (Exception e) {
                            echo "Integration tests failed, but we will proceed to collect reports."
                        } finally {
                            // 4. Extract Report & Cleanup
                            // Copy report from the specific runner container
                            sh "docker cp integration-runner-${env.BUILD_ID}:/integration-report.xml ./reports/integration-report.xml || true"
                            sh "docker rm integration-runner-${env.BUILD_ID} || true"
                        }
                    }
                }
            }
        }

        stage('Docker Tag & Push') {
            when { branch 'main' }
            steps {
                script {
                    // Tagging
                    sh "docker tag $APP_IMAGE_NAME:$APP_IMAGE_TAG $ECR_IMAGE:$APP_IMAGE_TAG"
                    sh "docker tag $APP_IMAGE_NAME:$APP_IMAGE_TAG $ECR_IMAGE:sha-$GIT_SHA"
                    
                    // Pushing
                    docker.image('amazon/aws-cli').inside('--entrypoint=""') {
                        ecrLoginPassword = sh(script: "aws ecr get-login-password --region ${env.AWS_REGION}", returnStdout: true).trim()
                    }
                    sh """
                        set +x
                        echo '${ecrLoginPassword}' | docker login --username AWS --password-stdin https://${env.ECR_REGISTRY}
                        set -x
                        docker push $ECR_IMAGE:$APP_IMAGE_TAG
                        docker push $ECR_IMAGE:sha-$GIT_SHA
                    """
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
                // Global Cleanup
                sh 'docker compose down -v --remove-orphans'
                sh 'docker system prune -f'
                sh 'rm -f .env'
                
                // Process Reports (Unit + Integration)
                // The pattern 'reports/*.xml' finds ALL reports we collected
                if (findFiles(glob: 'reports/*.xml')) {
                    junit 'reports/*.xml'
                    
                    publishHTML([
                        allowMissing: true,
                        alwaysLinkToLastBuild: true,
                        reportDir: 'htmlcov',
                        reportFiles: 'index.html',
                        reportName: 'Unit Test Coverage'
                    ])
                } else {
                    echo "WARNING: No test reports found. Marking build as UNSTABLE."
                    currentBuild.result = 'UNSTABLE'
                }
            }
        }
        success {
            sendSlack('SUCCESS', '#1E90FF')
            updateGitlabCommitStatus name: 'build', state: 'success'
        }
        unstable {
            sendSlack('WARNING: Missing Tests', 'warning') 
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