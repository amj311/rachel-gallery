#!/bin/sh

# load env vars from file if present
# Otherwise the should already be present
if [[ -f .env.deploy ]]; then
	. .env.deploy
fi

# # Load key into new file if provided
# TMP_KEY_FILE=./tmp.pem
# if [[ -n "$KEY_TEXT" ]]; then
# 	echo "$KEY_TEXT" > $TMP_KEY_FILE
# 	KEY_FILE=$TMP_KEY_FILE
# fi

# if [[ -z "$KEY_FILE" ]]; then
# 	echo "Cannot find SSH key!"
# 	exit 1
# fi

# Build code
echo "Building server..."
cd server && yarn build && cd ..

# Stop previous containers
DOCKER_HOST=ssh://${SSS_USER}@${SSH_HOST} docker-compose -f docker-compose-prod.yml down

# Run docker compose on host, force build
DOCKER_HOST=ssh://${SSS_USER}@${SSH_HOST} docker-compose -f docker-compose-prod.yml up -d --build --force-recreate

# consider running image prune here....

# # Remove tmp file if created
# if [[ -f $TMP_KEY_FILE ]]; then
# 	echo "Removing tmp key file"
# 	rm $TMP_KEY_FILE
# fi

echo "Finished!"

exit 0