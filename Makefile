all: blockly-master esimages testdeps

testdeps: hotswapping-js-interp esimages

blockly-master: blockly.tar.gz
	tar xzf blockly.tar.gz

blockly.tar.gz:
	curl -L -o blockly.tar.gz https://github.com/google/blockly/archive/master.tar.gz

hotswapping-js-interp:
	git clone https://github.com/thomasballinger/hotswapping-js-interp.git
	cd hotswapping-js-interp; git pull

esimages:
	svn export https://github.com/endless-sky/endless-sky/trunk/images esimages

bundle.js: FORCE
	node_modules/.bin/webpack

deploy: bundle.js
	rsync -r index.html bundle.js esimages tom:/home/tomb/missilecmd
	rsync -r ./hotswapping-js-interp/* tom:/home/tomb/missilecmd/hotswapping-js-interp/

FORCE:
