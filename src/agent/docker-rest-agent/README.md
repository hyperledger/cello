## Pre-requisite

If you want to use agent, first use the make docker-rest-agent command to generate the image; then run it；

 “docker run -p 5001:5001 -e DOCKER_URL="http://x.x.x.x:2375" -d hyperldger/cello-agent-docker:latest” 
 
When you run it, you must fill in the IP address of your docker server；
