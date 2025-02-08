#!/bin/sh

# load env vars from file if present
# Otherwise the should already be present
if [[ -f .env.deploy ]]; then
	. .env.deploy
fi

cat 'backup.sh' | ssh -o ExitOnForwardFailure=yes ${SSH_USER}@${SSH_HOST}

# Run docker compose on host, force build and recreate
echo -e "\n\nDeploying new docker image...\n"
sudo DOCKER_HOST=ssh://${SSH_USER}@${SSH_HOST} docker-compose -f docker-compose-prod.yml up -d --build --force-recreate > /dev/null


echo -e "\nCleaning up...\n"
# Post build cleanup
sudo DOCKER_HOST=ssh://${SSH_USER}@${SSH_HOST} docker system prune -f --filter "label=com.docker.compose.project=gallery" > /dev/null

echo -e "Finished!"
exit 0