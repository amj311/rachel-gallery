#!/bin/sh

PROJECT="rachel-gallery"
BACKUP_DIR="${HOME}/backups/${PROJECT}"
VOLUME="gallery-db"

# Check if the script should run locally or remotely
if [ "$1" = "--remote" ]; then

	# Load SSH vars
	if [[ -f .env.deploy ]]; then
		. .env.deploy
	fi

	echo -e "\nExecuting restore on remote server ${SSH_HOST}..."
	ssh ${SSH_USER}@${SSH_HOST} "bash -s" <"$0"
	exit $?
fi

# Find the most recent backup file
LATEST_BACKUP=$(ls -t ${BACKUP_DIR}/${PROJECT}_${VOLUME}_*.tar 2>/dev/null | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
	echo "No backup files found in ${BACKUP_DIR}."
	exit 1
fi

echo -e "\nRestoring the most recent backup: ${LATEST_BACKUP}..."

# Start a temporary container to restore the volume
sudo docker run --rm --volumes-from $VOLUME -v $LATEST_BACKUP:/backup.tar ubuntu bash -c "cd / && tar xvzf /backup.tar > /dev/null"

echo -e "\nRestoration completed for volume '${VOLUME}' from ${LATEST_BACKUP}."
