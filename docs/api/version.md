## Version

###Check
* Available Clients
	* 'ios'

```
POST /version/:client
```

####Post Data

```
{
	version: String
}
```

####Response

#####Success

```
{
	status: supported
}
```

#####Failure

Status: 400

* Error Codes:
	* Client not supported: 1101
	* Client upgrade required: 1102
	* Client upgrade available: 1103

```
{
	message: String
	errors: [{
		message: String,
		code: Number
	}]
}
```


