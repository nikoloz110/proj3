const express = require("express");
const hbs = require("hbs");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "/public")));
app.set("view engine", "hbs");
hbs.registerPartials(__dirname + "/views/partials");

class Person {
  constructor(name, surname, fathersName = "", IDNumber, dateOfBirth = "") {
    (this.name = name),
      (this.surname = surname),
      (this.fathersName = fathersName),
      (this.IDNumber = IDNumber),
      (this.dateOfBirth = dateOfBirth),
      (this.disabled = false),
      (this.personID = people.length + 1);
  }
  static validateInputs(template, message, req, res) {
    if (!req.body.name || !req.body.surname || !req.body.IDNumber) {
      res.status(400).render(template, {
        message
      });
      return true;
    }
  }
  static searchPerson(personID = "", name = "", surname = "", IDNumber = "") {
    let person;
    if (personID) {
      person = people.find(person => person.personID == personID);
    } else if (name && surname) {
      person = people.find(
        person => person.name === name && person.surname === surname
      );
    } else if (IDNumber) {
      person = people.find(person => person.IDNumber == IDNumber);
    }
    return person == undefined || person.disabled ? false : person;
  }
  static findDuplicate(req) {
    if (people.find(person => person.IDNumber === req.body.IDNumber)) {
      return true;
    }
  }
}
class Car {
  constructor(
    make = "",
    model = "",
    VIN,
    licensePlateNumber,
    color = "",
    ownerID
  ) {
    (this.make = make),
      (this.model = model),
      (this.VIN = VIN),
      (this.licensePlateNumber = licensePlateNumber),
      (this.color = color),
      (this.ownerID = ownerID),
      (this.previousOwners = new Set()),
      (this.disabled = false),
      (this.carID = cars.length + 1);
  }
  static validateInputs(template, message, req, res) {
    if (!req.body.VIN || !req.body.licensePlateNumber) {
      res.status(400).render(template, {
        error: message
      });
      return true;
    }
  }
  static searchCar(carID = "", VIN = "", licensePlateNumber = "") {
    let car;
    if (carID) {
      car = cars.find(car => car.carID == carID);
    } else if (VIN) {
      car = cars.find(car => car.VIN == VIN);
    } else if (licensePlateNumber) {
      car = cars.find(car => car.licensePlateNumber == licensePlateNumber);
    }
    return car == undefined || car.disabled ? false : car;
  }
  static findDuplicate(req) {
    if (
      cars.find(
        car =>
          car.VIN == req.body.VIN ||
          car.licensePlateNumber == req.body.licensePlateNumber
      )
    ) {
      return true;
    }
  }
  prevOwners() {
    let prevOwnersObjects = [];
    this.previousOwners.forEach(ownerID => {
      prevOwnersObjects.push(Person.searchPerson(ownerID));
    });
    return prevOwnersObjects;
  }
}

const people = [];
const cars = [];
let disabledPeople = [];
let disabledCars = [];

// ----------------------      ROOT  ENDPOINT     ----------------------
// ---------------------------------------------------------------------

app.get("/", (req, res) => {
  res.render("index.hbs", {});
});

// ----------------------      /person/info  ENDPOINT     ---------------
// ---------------------------------------------------------------------

app.post("/person/info", (req, res) => {
  // ---------------------    CREATE PERSON      ------------------------
  // --------------------------------------------------------------------
  if (req.body.operation === "createPerson") {
    //-----------------------validate inputs
    if (
      Person.validateInputs(
        "personInfo",
        "Fill Name, Surname and ID Number",
        req,
        res
      )
    ) {
      return false;
    }
    //--------------------check data for duplicates
    if (Person.findDuplicate(req)) {
      res.render("index.hbs", {
        error: "Person with given ID Number already exists."
      });
      return;
    }
    //------------------ create new person instance
    person = new Person(
      req.body.name,
      req.body.surname,
      req.body.fathersName,
      req.body.IDNumber,
      req.body.dateOfBirth
    );
    //---------------- add person to people's array
    people.push(person);
    res.render("personInfo.hbs", person);
    // ---------------------    UPDATE PERSON      ------------------------
    // --------------------------------------------------------------------
  } else if (req.body.operation === "updatePerson") {
    //-----------------------validate inputs
    if (
      Person.validateInputs(
        "personInfo",
        "Fill Name, Surname and ID Number",
        req,
        res
      )
    ) {
      return false;
    }
    //-----------------------search for right person
    let person = Person.searchPerson(req.body.personID);
    //-----------------------update person data
    person.name = req.body.name;
    person.surname = req.body.surname;
    person.fathersName = req.body.fathersName;
    person.IDNumber = req.body.IDNumber;
    person.dateOfBirth = req.body.dateOfBirth;
    //-----------------------get person's cars
    personsCars = cars.filter(
      car => car.ownerID == person.personID && !car.disabled
    );
    person.personsCars = personsCars;
    //----------------------render page with data
    res.render("personInfo.hbs", person);
    // ---------------------    SEARCH PERSON      ------------------------
    // --------------------------------------------------------------------
  } else if (req.body.operation === "searchPerson") {
    //----------------------search person
    let person = Person.searchPerson(
      req.body.personID,
      req.body.name,
      req.body.surname,
      req.body.IDNumber
    );
    //--------------inform and render if person was not found
    if (!person) {
      res.render("index.hbs", {
        error: "Person with given credentials Not found"
      });
      return false;
    }
    //-----------------------get person's cars
    let personsCars = cars.filter(
      car => car.ownerID == person.personID && !car.disabled
    );
    person.personsCars = personsCars;
    //----------------------render page with data
    res.render("personInfo.hbs", person);
    // ---------------------    CREATE CAR      ------------------------
    // --------------------------------------------------------------------
  } else if (req.body.operation === "addCar") {
    if (
      Car.validateInputs(
        "personInfo.hbs",
        "Fill VIN or License Plate Number",
        req,
        res
      )
    ) {
      return false;
    }
    //if there already is a car with same VIN or Plate Number, show error and render page with previous data
    if (Car.findDuplicate(req)) {
      let person = Person.searchPerson(req.body.ownerID);
      let personsCars = cars.filter(
        car => car.ownerID == person.personID && !car.disabled
      );
      let personAndCars = { ...person, ...{ personsCars } };
      personAndCars.error =
        "There already is a car with the same VIN or Plate Number";
      res.render("personInfo.hbs", personAndCars);
      return;
    }
    //----------------------create new car instance
    car = new Car(
      req.body.make,
      req.body.model,
      req.body.VIN,
      req.body.licensePlateNumber,
      req.body.color,
      req.body.ownerID
    );
    //----------------------add car to cars array
    cars.push(car);
    //----------------------get car owner
    const person = Person.searchPerson(car.ownerID);
    //----------------------get other cars of that owner
    let personsCars = cars.filter(
      car => car.ownerID == person.personID && !car.disabled
    );
    person.personsCars = personsCars;
    //----------------------render the page with data
    res.render("personInfo.hbs", person);
    // ---------------------    UPDATE CAR      ------------------------
    // -----------------------------------------------------------------
  } else if (req.body.operation === "updateCar") {
    if (
      Car.validateInputs(
        "personInfo.hbs",
        "Fill VIN or License plate number",
        req,
        res
      )
    ) {
      return false;
    }
    //----------------------find the right car
    let car = Car.searchCar(req.body.carID);
    //----------------------update car data
    car.make = req.body.make;
    car.model = req.body.model;
    car.VIN = req.body.VIN;
    car.licensePlateNumber = req.body.licensePlateNumber;
    car.color = req.body.color;
    //----------------------get car owner
    const person = Person.searchPerson(car.ownerID);
    //----------------------get other cars of owner
    let personsCars = cars.filter(
      car => car.ownerID == person.personID && !car.disabled
    );
    person.personsCars = personsCars;
    //-----------------------render page with data
    res.render("personInfo.hbs", person);
  }
});

// ----------------------      /car/info  ENDPOINT     -----------------
// ---------------------------------------------------------------------

app.post("/car/info", (req, res) => {
  // ----------------------      SEARCH CAR   -----------------
  // ---------------------------------------------------------------------
  if (req.body.operation === "searchCar") {
    //----------------------search car
    let car = Car.searchCar(
      req.body.carID,
      req.body.VIN,
      req.body.licensePlateNumber
    );
    //-----------notify if search was not successful and render
    if (!car) {
      res.render("index.hbs", {
        error: "Car was not found"
      });
      return false;
    }
    //----------------------get owner of the car
    let person = Person.searchPerson(car.ownerID);
    let prevOwnersObjects = car.prevOwners();
    //----------------bundle data for render
    let personsAndCar = { ...person, ...car, ...{ prevOwnersObjects } };
    //----------------render page with data
    res.render("carInfo.hbs", personsAndCar);
    // ----------------------      UPDATE CAR   -----------------
    // ---------------------------------------------------------------------
  } else if (req.body.operation === "updateCar") {
    //-------------------------search car
    let car = Car.searchCar(
      req.body.carID,
      req.body.VIN,
      req.body.licensePlateNumber
    );
    //-------------------------get owner
    let person = Person.searchPerson(car.ownerID);
    //-------------------------update car data
    car.make = req.body.make;
    car.model = req.body.model;
    car.VIN = req.body.VIN;
    car.licensePlateNumber = req.body.licensePlateNumber;
    car.color = req.body.color;
    //----------------bundle data for render
    let prevOwnersObjects = car.prevOwners();
    let personAndCar = { ...person, ...car, ...{ prevOwnersObjects } };
    //----------------render page with data
    res.render("carInfo.hbs", personAndCar);
    // ----------------------     CHANGE OWNER   -----------------
    // ---------------------------------------------------------------------
  } else if (req.body.operation === "updatePerson") {
    //-----------------------search person
    let person = Person.searchPerson(
      undefined,
      req.body.name,
      req.body.surname,
      req.body.IDNumber
    );
    //-----------------------if person was not found, render page with previous data
    if (!person) {
      let person = Person.searchPerson(req.body.ownerID);
      let car = Car.searchCar(req.body.carID);
      let prevOwnersObjects = car.prevOwners();
      let personsAndCar = { ...person, ...car, ...{ prevOwnersObjects } };
      personsAndCar.error = "Person with given credentials was not found";
      res.render("carInfo.hbs", personsAndCar);
      return;
    }
    //-----------------------search car
    let car = Car.searchCar(req.body.carID);
    //-----------------add previous owners id to car
    car.previousOwners.add(req.body.ownerID);
    //-----------------add previous owners id to car
    car.ownerID = person.personID;
    let prevOwnersObjects = car.prevOwners();
    //----------------bundle data for render
    let personsAndCar = { ...person, ...car, ...{ prevOwnersObjects } };
    //----------------render page with data
    res.render("carInfo.hbs", personsAndCar);
  }
});

// ----------------------     /admin ENDPOINT   -----------------
// ----------------------------------------------------------------

app.get("/admin", (req, res) => {
  //----------------render disabled people and cars
  res.render("admin.hbs", { disabledPeople, disabledCars });
});
app.post("/admin", (req, res) => {
  if (req.body.operation == "person") {
    //----------------find person to disable/enable
    let person = people.find(
      person =>
        person.IDNumber == req.body.IDNumber ||
        (person.name === req.body.name && person.surname === req.body.surname)
    );
    //----------------if person not found, show error and render page with prev data
    if (!person) {
      res.render("admin.hbs", {
        disabledPeople,
        disabledCars,
        error: "Person was not found"
      });
      return;
    } else {
      //----------------if person found, toggle disable/enable him
      person.disabled = !person.disabled;
      if (person.disabled) {
        disabledPeople.push(person);
      } else {
        disabledPeople = disabledPeople.filter(
          item => item.personID != person.personID
        );
      }
      res.render("admin.hbs", { disabledPeople, disabledCars });
    }
  } else if (req.body.operation == "car") {
    //----------------find car to disable/enable
    let car = cars.find(
      car =>
        car.VIN == req.body.VIN ||
        car.licensePlateNumber == req.body.licensePlateNumber
    );
    //----------------if car not found, show error and render page with prev data
    if (!car) {
      res.render("admin.hbs", {
        disabledPeople,
        disabledCars,
        error: "Car was not found"
      });
      return;
    } else {
      //----------------if car found, toggle disable/enable him
      car.disabled = !car.disabled;
      if (car.disabled) {
        disabledCars.push(car);
      } else {
        disabledCars = disabledCars.filter(item => item.carID != car.carID);
      }
      res.render("admin.hbs", { disabledPeople, disabledCars });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Listening to PORT - ${PORT}`);
});
