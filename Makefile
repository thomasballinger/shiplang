all: images/857-tileable-classic-nebula-space-patterns blockly-master

blockly-master: blockly.tar.gz
	tar xzf blockly.tar.gz

blockly.tar.gz:
	curl -L -o blockly.tar.gz https://github.com/google/blockly/archive/master.tar.gz

images/857-tileable-classic-nebula-space-patterns: spaceimages.zip
	unzip -d images spaceimages.zip

spaceimages.zip:
	curl -L -o spaceimages.zip https://www.dropbox.com/s/pq9vmxvvnj6t14l/857-tileable-classic-nebula-space-patterns.zip?dl=1