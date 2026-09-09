pipeline {
    agent any

    environment {
        COMPOSE_PROJECT = 'crudfullstack'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                sh 'mvn -f backend/pom.xml -q -DskipTests clean package'
                archiveArtifacts artifacts: 'backend/target/backend.jar', onlyIfSuccessful: true
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend-crud') {
                    sh 'npm ci'
                    sh 'npm run build -- --configuration production'
                }
                archiveArtifacts artifacts: 'frontend-crud/dist/**/*', onlyIfSuccessful: true
            }
        }

        stage('Deploy') {
            steps {
                sh "docker compose -f docker-compose.app.yml -p ${COMPOSE_PROJECT} up -d --build db backend frontend"
            }
        }
    }

    post {
        always {
            junit testResults: 'backend/target/surefire-reports/*.xml', allowEmptyResults: true
        }
        success {
            echo 'Despliegue completado correctamente.'
        }
        failure {
            echo 'El pipeline fallo. Revisa los logs de la etapa fallida.'
        }
    }
}