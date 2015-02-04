# DB Schema

* rough draft, wanted to get something up. Still working on it..

## Base

* Base object schema
	* taken from Andrew's suprizr code
	* I think I am going to take GUID generation from the suprizr code as well
* All others will inherit this

```
{
    _id: { type: String, default: SP.simpleGUID, index: { unique: true } },
    updated_at: { type: Number, default: Date.now },
    created_at: { type: Number, default: Date.now },
    deleted: { type: Boolean, default: false, select: false }
}
```

## Auth

* taken from Andrew's suprizr code
* considered putting this in the user collection but figured for security it could be easier to have it seperate
	* also would allow unique token per device
	* could easily drop entire collection if needed in a security breach

```
{
    auth_token : { type: String, default: SP.simpleGUID, required: true, index: { unique: true } },
    user       : { type: String, ref: "User", required: true, index : true },
    valid      : { type: Boolean, default: true }
}
```

## User

* password not required in the case a user signs up with facebook.
	* if they then register with a regular account we can update with a password

```
{
    first_name: String,
    last_name: String, 
    phone: String,
    gender: String, // maybe ?
    email: { type: String, index: { unique: true, sparse: true } },
    password: { type: String, required: false, select: false },
    facebook: { 
        id: { type: String, index: { unique: true, sparse: true } },
        username: String,
        auth_token: { type: String, select: false }
    },
    admin: Boolean,
    bookings: [
       { type : String, ref : 'Booking' }
    ],
    referral_key: String,
    credits: Number,
    parent_user: { type: String, ref: "User" },
}
```

## Venue

```
{
    name: String,
    phone: { type: String, default: null },
    cut: { type: String, default: .20 }, // default tablelist cut
    show: { type: Boolean, default: false },
    type: String,
    address: {
	    street: String,
	    city: String,
	    state: String,
	    zip: Number,
	    location: { type: [Number], index: { "loc" : "2d" } } // [ longitude, latitude ]
	},
    tables: [
       { type : String, ref : 'Table' }
    ],
    users: [
       { type : String, ref : 'User' }
    ],
    bookings: [
       { type : String, ref : 'Booking' }
    ],
    images: [{
		primary: Boolean,
		filename: String,
		description: String
	}],

	// schedule of table listings
	// 1 for each day of the week
	schedule: {
		monday: [{
			table: { type : String, ref : 'Table' },
			quantity: Number, // the number of this table configuration
			active: Boolean,
			start_time: Date, // only store start of available time
			end_time: Date, // only store start of available time,
			gm_user: { type : String, ref : 'User' }
		}],
		...
	},

	// array of schedule overrides
	// is an override exists for the date it will take presidence over the schedule
	overrides: [{
		date: Date, // date of the override
		// this will replace the schedule for that day
		schedule: {
			table: { type : String, ref : 'Table' },
			quantity: Number, // the number of this table configuration
			active: Boolean,
			start_time: Date, // only store start of available time
			end_time: Date, // only store start of available time,
			gm_user: { type : String, ref : 'User' }
		}
	}]
}
```

## Table
* a table is more of a deal configuration than it is a physical table

```
{
	venue: { type : String, ref : 'Venue' },
    guests: Number,
    price: Number,

	// table items
	items: [
       { type : String, ref : 'Item' }
	],
}
```

## Item

```
{
   name: String,
   description: String   
}
```

## Transaction

```
{
	user: { type : String, ref : 'User' },
	booking: { type : String, ref : 'Booking' },
	tx: String, // braintree transaction id
	charge: Number, // the amount the user was charged
	credit: Number, // the amount of user cred that was used
	void: Boolean  // whether the transaction has been voided
}
```

## Booking

```
{
	venue: { type : String, ref : 'Booking' }
	// list of users involved or invited to the booking
	users: [{
    	primary: Boolean, // the main user who created the booking
    	user: { type : String, ref : 'User' },
    	transaction: { type : String, ref : 'Transaction' }, // doesn't exist until payment is processed
  	}],
  	// list of invited contacts
  	invited: [{
	    user: { type : String, ref : 'User' }, // doesn't exist unless the user is registered
	    phone: Number, // the phone number used to invite a user
	    email: String, // the email used to invite a user
	    accepted: { type: Boolean, default: false } // if the user accepted the booking. When they do they are populated in the users list
  	}]
	arrival_time: Number,
	date: Date,
	total: Number, // total price
	split_code: String,
	items: [
		{ type : String, ref : 'Item' }
	],
	guests: Number
}
```