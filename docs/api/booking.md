## Booking

###Create

```
POST /booking
```

Post Data

```
{
	tableId: String - id of the table to book
	paymentProfileId: String - id of the payment profile to user
	items: [
		itemId: String - id of the item
		quantity: Number - number of that item to purchase
	]
	arrivalTime: Number (epoch time) - optional,
}
```

###Reservation

```
POST /booking
```

Post Data

```
{
	tableId: String - id of the table to book
	arrivalTime: Number (epoch time) - optional,
	promoter: Boolean,
	name: String - name of table buyer
	phone: String - phone number of table buyer
}
```
