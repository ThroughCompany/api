default: create-links
	npm install

create-links:
	cd ./node_modules; \
	ln -snf ../src; \
	ln -snf ../src/modules; \