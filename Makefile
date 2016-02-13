all: images/857-tileable-classic-nebula-space-patterns blockly-master

blockly-master: blockly.tar.gz
	tar xzf blockly.tar.gz

blockly.tar.gz:
	curl -L -o blockly.tar.gz https://github.com/google/blockly/archive/master.tar.gz

images/857-tileable-classic-nebula-space-patterns: spaceimages.zip
	unzip -d images spaceimages.zip
	rm images/857-tileable-classic-nebula-space-patterns/tileable-classic-nebula-space-patterns.*

spaceimages.zip:
	curl -L -o spaceimages.zip https://www.dropbox.com/s/pq9vmxvvnj6t14l/857-tileable-classic-nebula-space-patterns.zip?dl=1

hotswapping-js-interp:
	git clone https://github.com/thomasballinger/hotswapping-js-interp.git
	cd hotswapping-js-interp; git pull

bundle.js: FORCE
	webpack

deploy: bundle.js
	rsync -r index.html bundle.js images tom:/home/tomb/missilecmd
	rsync -r ./hotswapping-js-interp/* tom:/home/tomb/missilecmd/hotswapping-js-interp/

FORCE:
