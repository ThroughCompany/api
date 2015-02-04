## Auth

###Login

```
POST /auth/login
```

Post Data

```
{
	email: String,
	password: String,
}
```


###Register

```
POST /auth/register
```

Post Data

```
{
	email : String,
	firstName : String,
	lastName : String,
	password : String,
	phone : String,
}
```

###Forgot Password

```
POST /auth/forgot
```

Post Data

```
{
	email : String
}
```

###Reset Password

```
POST /auth/reset
```

Post Data

```
{
	resetToken : String,
	password : String
}
```