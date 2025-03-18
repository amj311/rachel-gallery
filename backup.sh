#!/bin/sh

PROJECT="rachel-gallery"
BACKUP_DIR="${HOME}/backups/${PROJECT}"
VOLUME="gallery-db"
FILE_NAME="${PROJECT}_${VOLUME}_$(date +%Y-%m-%d_%H-%M-%S).tar"

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

# Create the backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo -e "\nCreating backup for volume ${VOLUME}..."

# Start a temporary container to back up the "mysql_data" volume
# See https://www.howtogeek.com/devops/how-to-back-up-your-docker-volumes/
sudo docker run --rm --volumes-from $VOLUME -v $BACKUP_DIR:/backup-dir ubuntu tar czvf /backup-dir/${FILE_NAME} /var/lib/postgresql/data > /dev/null

echo -e "\nCreated backup for volume '${VOLUME}' at ${BACKUP_DIR}/${FILE_NAME}. Check above for any errors."