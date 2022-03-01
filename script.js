"use strict";

window.addEventListener("DOMContentLoaded", start);

let allStudents = [];

// The prototype for all students:
const Student = {
    firstname: "",
    lastname: "",
    middlename: undefined,
    nickname: undefined,
    gender: "",
    img: "",
    house: "",
    prefect: false,
    ismember: false, //Inquisitorial squad
    quidditch: false,
    expelled: false,
    bloodStatus: ""
}

function start() {
    console.log("1");
    let allFilterButtons = document.querySelectorAll(".filter-button");
    allFilterButtons.forEach(element => {
        element.addEventListener("input", filterList);
    });

    loadStudentsJson();
}

async function loadStudentsJson() {
    const response = await fetch("students.json");
    const jsonData = await response.json();
    console.log("2");

    prepareObjects(jsonData);
    loadFamiliesJson();
}

async function loadFamiliesJson() {
    const response = await fetch("families.json");
    const jsonData = await response.json();
    console.log("7");
    calculateBloodStatus(jsonData);
}

function prepareObjects(jsonData) {
    console.log("3");
    allStudents = jsonData.map(prepareObject);
    console.log(allStudents);
    console.log("5");

    displayList(allStudents);
}

function calculateBloodStatus(families) {
    console.log("8");
    for (let i = 0; i < allStudents.length; i++) {

        if (families.half.includes(allStudents[i].lastname)) {
            allStudents[i].bloodStatus = "half";
        } else if (families.pure.includes(allStudents[i].lastname)) {
            allStudents[i].bloodStatus = "pure";
        } else {
            allStudents[i].bloodStatus = "muggle";
        }
    }
}

function prepareObject(jsonObject) {
    const student = Object.create(Student);
    console.log("4");
    const fullName = jsonObject.fullname.trim();
    // Is string contains more than one name;
    if (fullName.includes(" ")) {

        // Add first name
        student.firstname = fullName.substring(0, fullName.indexOf(" "));
        student.firstname = namesWithCapLetters(student.firstname);

        // Add last name
        student.lastname = fullName.substring(fullName.lastIndexOf(" ") + 1);
        student.lastname = namesWithCapLetters(student.lastname);

        let middleName = fullName.substring(fullName.indexOf(" "), fullName.lastIndexOf(" ")).trim();

        // Add middle name
        if (middleName != "") {

            // Add nick name if "\"" quotes are included:
            if (middleName.includes("\"")) {
                student.nickname = middleName.substring(middleName.indexOf("\"") + 1, middleName.lastIndexOf("\"")).trim();
                student.nickname = namesWithCapLetters(student.nickname);

                // Subtract the middle name
                middleName = `${middleName.substring(0, middleName.indexOf("\"")) + middleName.substring(middleName.lastIndexOf("\"") + 1)}`;

                // Add middle name if not empty
                if (middleName != "") {
                    student.middlename = namesWithCapLetters(middleName);
                }
            } else {
                // Take the whole string as middle name
                student.middlename = namesWithCapLetters(middleName);
            }
        }
    } else {
        // Take what is there as first name
        student.firstname = namesWithCapLetters(fullName);
    }

    // Add house, gender
    student.house = namesWithCapLetters(jsonObject.house);
    student.gender = jsonObject.gender;

    // ToDo Add path to images
    student.img = `images/${student.lastname.toLowerCase()}_${student.firstname.charAt(0).toLowerCase()}.png`;

    return student;

}

// Make first letter capital and lower the rest for each word in a string
function namesWithCapLetters(string) {
    string = string.trim();

    // If the passed string has multiple names
    let namesArray = string.split(" ");

    for (let i = 0; i < namesArray.length; i++) {

        // Remove empty spaces
        if (namesArray[i].length == 0) {
            namesArray.splice(i, 1);
            i--;
        }

        if (namesArray[i].includes("-")) {
            namesArray[i] = namesArray[i].split("-");
            let tempArr = [];

            // divide the string name that has hyphen
            for (let n = 0; n < namesArray[i].length; n++) {
                namesArray[i][n] = (namesArray[i][n].charAt(0).toUpperCase()) + namesArray[i][n].substring(1).toLowerCase();
                tempArr.push(namesArray[i][n]);
            }
            // and reunite them again
            tempArr = tempArr.join('-');
            namesArray[i] = tempArr;
        } else {
            namesArray[i] = namesArray[i].charAt(0).toUpperCase() + namesArray[i].substring(1).toLowerCase();
        }
    }

    return namesArray.join(" ");
}

function displayList(students) {
    // clear the list
    document.querySelector("#list tbody").innerHTML = "";
    console.log("6")
    students.forEach(displayStudent);
}

function displayStudent(student) {
    // create clone
    const clone = document.querySelector("template#student").content.cloneNode(true);

    // set clone data
    clone.querySelector("[data-field=firstName]").textContent = student.firstname;
    clone.querySelector("[data-field=lastName]").textContent = student.lastname;
    clone.querySelector("[data-field=house]").textContent = student.house;

    // clone.querySelector("[data-field=prefect]").textContent = student.firstname;
    // clone.querySelector("[data-field=inqSquad]").textContent = student.firstname;
    // clone.querySelector("[data-field=quidditch]").textContent = student.firstname;

    document.querySelector("#list tbody").appendChild(clone);
}

function filterList(buttonElm) {
    let filterBy = buttonElm.target.value;
    console.log(filterBy);

    if (filterBy != "*") {
        filteredAnimals = allAnimals.filter(isAnimalType);
    } else {
        filteredAnimals = allAnimals;
    }

    displayList(filteredAnimals);
}