#!/bin/sh

BACKUP_DIR="${HOME}/backups"
PROJECT="rachel-gallery"
VOLUME="gallery-db"
FILE_NAME="${PROJECT}_${VOLUME}_$(date +%Y-%m-%d_%H-%M-%S).tar"

echo -e "\nCreating backup for volume ${VOLUME}..."

# Start a temporary container to back up the "mysql_data" volume
# See https://www.howtogeek.com/devops/how-to-back-up-your-docker-volumes/
sudo docker run --rm --volumes-from $VOLUME -v $BACKUP_DIR:/backup-dir ubuntu tar cvf /backup-dir/${FILE_NAME} /var/lib/postgresql/data > /dev/null

echo -e "\nCreated backup for volume '${VOLUME}' at ${BACKUP_DIR}/${FILE_NAME}. Check above for any errors."