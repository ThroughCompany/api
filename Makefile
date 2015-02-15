default:
	npm install

post-install:
	cd ./node_modules; \ #create symlinks
	ln -snf ../src; \
	ln -snf ../src/modules; \
	ln -snf ../tests; \
	gulp db-seed \ #seed database

test:
	./node_modules/.bin/_mocha \
	"tests/integration/**/*-test*" \
	-t 20000 -R spec