default:
	npm install

post-install:
	cd ./node_modules; \
	ln -snf ../src; \
	ln -snf ../src/modules; \
	ln -snf ../tests; \