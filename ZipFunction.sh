#!/bin/bash
if [ -n "$1" ];
    then
        if [ -d dist ];
            then
                TEMP_DIR=__temp.$1
                echo 'Creating temp directory'
                mkdir $TEMP_DIR
                echo 'Copying code to temp directory'
                cp -r dist $TEMP_DIR
                cp package.json $TEMP_DIR
                cd $TEMP_DIR && npm install --production && cd ../
                echo 'Zipping function ' $1
                ZIP_FILE=$1
                cd $TEMP_DIR && zip -r ../$ZIP_FILE.zip * && cd ..
                echo 'Removing temp directory'
                rm -rf $TEMP_DIR
            else
                echo 'Could not find a dist folder. Please run: npm run build'
        fi;
    else
        echo 'Please enter the name of the function you would like to zip';
fi;