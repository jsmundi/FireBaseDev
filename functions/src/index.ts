import * as functions from 'firebase-functions';
//Import the firebase admin to access the database
import * as admin from 'firebase-admin'
//Initialize the firebase admin
admin.initializeApp()


export const getBostAreaWeather = 
functions.https.onRequest((request, response) => {
    admin.firestore().doc("areas/greater-boston").get()
    .then(areaSnapshot => {
        const cities = areaSnapshot.data().cities

        //Push all the promises into an array.
        //Get data for each city
        const promises = []
        for (const city in cities) {
           const p =  admin.firestore().doc(`cities-weather/${city}`).get() 
           promises.push(p)
        }

        return Promise.all(promises)
    })


    .then(citySnapshots => {
        const results = []
        citySnapshots.forEach(citySnap => {
            const data = citySnap.data()
            //Add id of each object 
            data.city = citySnap.id
            results.push(data)
        })
        //Return the json with results to client
        response.send(results)
    })
    .catch(error => {
        console.log(error)
        response.status(500).send(error)
    })
})

//Get update on update of data in firestore (Background Trigger)
export const onBostonWeatherUpdate = 
functions.firestore.document("cities-weather/boston-ma-us").onUpdate(change => {
    //Get data in json after update
    const after = change.after.data()
    const payload = {
        data: {
            temp: String(after.temp),
            conditions: after.conditions
        }
    }

    // Send data paylod to weather_bost... fcm sdk to update for all apps.
    // Return to handle the promise and check for error to complete the promise
    return admin.messaging().sendToTopic("weather_boston-ma-us", payload)
    .catch(error => {
        console.error("FCM Failed", error)
    })
})

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const getBostonWeather = functions.https.onRequest((request, response) => {
    //Use a promise to get a snapshot of the document.
    admin.firestore().doc('cities-weather/boston-ma-us').get()

    .then(snapshot=> {
        const data = snapshot.data()
        response.send(data)
    })

    .catch(error => {
        //Handle Error
        console.log(error)
        //Send custom error messages if needed. (Do not send private info!!)
        response.status(500).send(error)
    });
    
});
