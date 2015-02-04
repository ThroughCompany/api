# API Endpoints

## Basic Flow

Basic API call flow in mind.

The details (input params and whatnot) of the calls will be documented below.. someday..

####City Page
* Get all cities

```
GET /city
```

* **TODO** Get all nearby venues 

```
GET /venue/near
```

####Venue Page
* Get all venues for the city
	* This will have to return either the venues tables, or the minimum table so we can show price/guest values on the venue list

```
GET /city/:cityId/venue
```

####Venue Detail Page
* Get venue details
	* depending on what is returned in the previous call maybe we don't even need to make this call (unless we are doing a refresh on the venue detail page)

```
GET /venue/:venueId
```

* Book table

```
POST /booking
```

####Booking Receipt
* Get book details (same data should be returned on booking create)

```
GET /booking/:id
```

## Endpoints Details

#### [**Auth**](auth.md): Login and Registration
#### [**Version**](version.md): Client Version Check
#### [**Booking**](booking.md): Createing and reading Bookings

#### **City**: TODO
#### **Venue**: TODO
