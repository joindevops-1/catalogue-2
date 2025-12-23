pipeline {
    // These are pre-build sections
    agent {
        node {
            label 'AGENT-1'
        }
    }
    environment {
        COURSE = "Jenkins"
        appVersion = ""
        region = "us-east-1"
        ACC_ID = "160885265516"
        PROJECT = "roboshop"
        COMPONENT = "catalogue"
    }
    options {
        timeout(time: 10, unit: 'MINUTES') 
        disableConcurrentBuilds()
    }
    // This is build section
    stages {
        stage('Read Version') {
            steps {
                script{
                    def packageJSON = readJSON file: 'package.json'
                    appVersion = packageJSON.version
                    echo "app version: ${appVersion}"
                }
            }
        }
        stage('Install Dependencies') {
            steps {
                script{
                    sh """
                        npm install
                    """
                }
            }
        }
        stage('Build Image') {
            steps {
                script{
                    withAWS(credentials: 'aws-creds', region: "${region}") {
                    // AWS commands or plugin steps can be run here
                        sh """
                            aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${ACC_ID}.dkr.ecr.us-east-1.amazonaws.com
                            docker build -t ${ACC_ID}.dkr.ecr.us-east-1.amazonaws.com/${PROJECT}/${COMPONENT}:${appVersion} .
                            docker images
                            docker push ${ACC_ID}.dkr.ecr.us-east-1.amazonaws.com/${PROJECT}/${COMPONENT}:${appVersion}
                        """
                    }
                }
            }
        }
        stage('Check Scan Results') {
  steps {
    script {
      withAWS(credentials: 'aws-creds', region: 'us-east-1') {

        // NOTE:
        // - ECR scan-on-push is enabled, so we only WAIT + READ findings
        // - Handles multi-arch pushes (Image Index) by scanning child image digests

        def repo = "${PROJECT}/${COMPONENT}"

        // 1) Resolve the digest for the tag (often an Image Index)
        def indexDigest = sh(
          script: """
            aws ecr describe-images \
              --repository-name ${repo} \
              --image-ids imageTag=${appVersion} \
              --region ${REGION} \
              --query 'imageDetails[0].imageDigest' \
              --output text
          """,
          returnStdout: true
        ).trim()

        if (!indexDigest || indexDigest == "None") {
          error("Could not resolve digest for ${repo}:${appVersion}")
        }

        // 2) If it's an Image Index, extract child digests; otherwise scan the single digest
        def childDigestsText = sh(
          script: """
            aws ecr batch-get-image \
              --repository-name ${repo} \
              --image-ids imageTag=${appVersion} \
              --accepted-media-types application/vnd.oci.image.index.v1+json application/vnd.docker.distribution.manifest.list.v2+json \
              --region ${REGION} \
              --query 'images[0].imageManifest' \
              --output text | jq -r '.manifests[].digest' 2>/dev/null || true
          """,
          returnStdout: true
        ).trim()

        def digestsToCheck = []
        if (childDigestsText) {
          digestsToCheck = childDigestsText.split("\\r?\\n").findAll { it?.trim() }
          echo "Multi-arch Image Index detected for ${repo}:${appVersion}. Child digests: ${digestsToCheck}"
        } else {
          digestsToCheck = [indexDigest]
          echo "Single image detected for ${repo}:${appVersion}. Digest: ${indexDigest}"
        }

        // 3) Wait for scan results and gate on HIGH/CRITICAL
        def totalHighCritical = 0
        def offenders = []

        digestsToCheck.each { d ->
          echo "Checking scan status for ${repo}@${d}"

          // Wait up to 10 minutes for scan to complete (scan-on-push can take time)
          def status = "IN_PROGRESS"
          for (int i = 0; i < 120; i++) {
            status = sh(
              script: """
                aws ecr describe-images \
                  --repository-name ${repo} \
                  --image-ids imageDigest=${d} \
                  --region ${REGION} \
                  --query 'imageDetails[0].imageScanStatus.status' \
                  --output text
              """,
              returnStdout: true
            ).trim()

            if (status == "COMPLETE" || status == "FAILED") break
            sleep(time: 5, unit: 'SECONDS')
          }

          if (status != "COMPLETE") {
            error("ECR scan not complete for ${repo}@${d}. status=${status}")
          }

          // Fast gate via severity counts
          def countsJsonText = sh(
            script: """
              aws ecr describe-image-scan-findings \
                --repository-name ${repo} \
                --image-id imageDigest=${d} \
                --region ${REGION} \
                --query 'imageScanFindings.findingSeverityCounts' \
                --output json
            """,
            returnStdout: true
          ).trim()

          def counts = readJSON text: countsJsonText
          def high = (counts.HIGH ?: 0) as Integer
          def critical = (counts.CRITICAL ?: 0) as Integer

          echo "Scan counts for ${repo}@${d}: CRITICAL=${critical}, HIGH=${high}, MEDIUM=${counts.MEDIUM ?: 0}, LOW=${counts.LOW ?: 0}"

          if (high > 0 || critical > 0) {
            totalHighCritical += (high + critical)

            // Capture a concise list of offending CVEs
            def findingsText = sh(
              script: """
                aws ecr describe-image-scan-findings \
                  --repository-name ${repo} \
                  --image-id imageDigest=${d} \
                  --region ${REGION} \
                  --query 'imageScanFindings.findings[?severity==`HIGH` || severity==`CRITICAL`].[name,severity,attributes[?key==`package_name`].value|[0],attributes[?key==`package_version`].value|[0]]' \
                  --output json
              """,
              returnStdout: true
            ).trim()

            offenders << [digest: d, items: readJSON(text: findingsText)]
          }
        }

        if (totalHighCritical > 0) {
          echo "❌ SECURITY GATE FAILED: Found ${totalHighCritical} HIGH/CRITICAL vulnerabilities in ${repo}:${appVersion}"
          offenders.each { o ->
            echo "Digest: ${o.digest}"
            o.items.each { row ->
              // row = [CVE, severity, package_name, package_version]
              echo " - ${row[0]} (${row[1]})  pkg=${row[2]}:${row[3]}"
            }
          }
          error("Build failed due to HIGH/CRITICAL vulnerabilities.")
        } else {
          echo "✅ SECURITY GATE PASSED: No HIGH/CRITICAL vulnerabilities found in ${repo}:${appVersion}"
        }
      }
    }
  }
}

        
    }
    post{
        always{
            echo 'I will always say Hello again!'
            cleanWs()
        }
        success {
            echo 'I will run if success'
        }
        failure {
            echo 'I will run if failure'
        }
        aborted {
            echo 'pipeline is aborted'
        }
    }
}