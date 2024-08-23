#!/bin/sh

# See https://www.howtogeek.com/devops/how-to-back-up-your-docker-volumes/

# Start a temporary container to back up the "mysql_data" volume
docker run --rm --volumes-from gallery-db -v $PWD:/backup-dir ubuntu tar cvf /backup-dir/gallery-db-backup.tar /var/lib/postgresql/data