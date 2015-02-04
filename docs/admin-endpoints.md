# API Admin Endpoints

## Basic Flow

####Venues Page
* Get all venues that the user is an admin on

```
GET /venue/admin
```

####Schedules Page
* Get the weekly schedule for the venue

```
GET /venue/:id/schedule
```

####Table Page
* Create a new table

```
POST /table
```

Post Data

```
{
	venue: String,
	guests: Number,
	price: Number,
	active: Boolean,
	quantity: Number,

	// Time below are between 0000 - 2359
	// ex: 0000 = 12:00 AM
	// ex: 2359 = 11:59 PM
	startTime: Number, 
	endTime: Number,
	arrivalStartTime: Number,
	arrivalEntTime: Number
}
```

* Get table info 

```
GET /table/:id
```

* Update table info

```
PUT /table/:id
```

Post Data

```
{
	venue: String,
	guests: Number,
	price: Number,
	active: Boolean,
	quantity: Number,

	// Time below are between 0000 - 2359
	// ex: 0000 = 12:00 AM
	// ex: 2359 = 11:59 PM
	startTime: Number, 
	endTime: Number,
	arrivalStartTime: Number,
	arrivalEntTime: Number
}
```


####Booking Page
* List all bookings for the users venues

```
GET /booking/admin
```

* List bookings per venue

```
GET /booking/venue/:id
```	

