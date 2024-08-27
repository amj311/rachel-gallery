#!/bin/sh

# load env vars from file if present
# Otherwise the should already be present
if [[ -f .env.deploy ]]; then
	. .env.deploy
fi

# Stop previous containers
DOCKER_HOST=ssh://${SSS_USER}@${SSH_HOST} docker-compose -f docker-compose-prod.yml down

# Run docker compose on host, force build
DOCKER_HOST=ssh://${SSS_USER}@${SSH_HOST} docker-compose -f docker-compose-prod.yml up -d --build --force-recreate

# consider running image prune here....

echo "Finished!"

exit 0