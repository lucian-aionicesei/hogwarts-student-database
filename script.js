"use strict";

window.addEventListener("DOMContentLoaded", start);

let allStudents = [];
let filteredStudents = [];
let expelledStudents = [];
let systemSafety = true;

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
    inqSquad: false, //Inquisitorial squad
    clubs: [],
    expelled: false,
    bloodStatus: ""
}

function start() {

    let allFilterButtons = document.querySelectorAll(".filter-button");
    allFilterButtons.forEach(element => {
        element.addEventListener("input", filterList);
    });

    let allSortingButtons = document.querySelectorAll("[data-action=sort]");
    allSortingButtons.forEach(element => {
        element.addEventListener("click", sort);
    });

    loadStudentsJson();

    // add eventlistener to searchfield
    document.querySelector("#search-input").addEventListener("input", searchFieldInput);

    // document.querySelector("#expell-button").addEventListener("click", () => {
    //     expellStudent();
    // })
}

async function loadStudentsJson() {
    const response = await fetch("students.json");
    const jsonData = await response.json();

    prepareObjects(jsonData);
    loadFamiliesJson();
}

async function loadFamiliesJson() {
    const response = await fetch("families.json");
    const jsonData = await response.json();
    calculateBloodStatus(jsonData);
}

function prepareObjects(jsonData) {
    allStudents = jsonData.map(prepareObject);
    filteredStudents = allStudents;

    displayList(allStudents);
}

function calculateBloodStatus(families) {

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
    student.img = `assets/students/${student.lastname.toLowerCase()}_${student.firstname.charAt(0).toLowerCase()}.png`;

    return student;

}

// Make full string name/names to proper letter size
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
    displayListInfo(students);
    students.forEach(displayStudent);
}

function displayStudent(student) {
    // create clone
    const clone = document.querySelector("template#student").content.cloneNode(true);

    // set clone data
    clone.querySelector("[data-field=firstName]").textContent = student.firstname;
    clone.querySelector("[data-field=lastName]").textContent = student.lastname;
    clone.querySelector("[data-field=gender]").textContent = student.gender;
    clone.querySelector("[data-field=house]").textContent = student.house;
    clone.querySelector("[data-field=houseColor]").style.backgroundColor = `var(--${student.house})`;

    // Display if member of the Inquisitorial Squad
    if (student.inqSquad && student.bloodStatus === "pure" || student.inqSquad && student.house === "Slytherin") {
        clone.querySelector("[data-field=inqSquad]").removeAttribute("data-inqSquad", "false");
    } else {
        clone.querySelector("[data-field=inqSquad]").setAttribute("data-inqSquad", "false");
    }

    // Display if prefect
    if (student.prefect) {
        clone.querySelector("[data-field=prefect]").removeAttribute("data-prefect", "false");
    } else {
        clone.querySelector("[data-field=prefect]").setAttribute("data-prefect", "false");
    }

    // Add event listeners for inqSquad and prefect
    clone.querySelector("[data-field=inqSquad] img").addEventListener('click', () => {
        inqSquadClick(student, 0);
    });

    clone.querySelector("[data-field=prefect] img").addEventListener('click', () => {
        prefectClick(student);
    });

    // Add event listener for pop-up
    clone.querySelector("tr").addEventListener('click', (event) => {
        if (event.target.tagName !== "IMG") {
            displayStudentPopUp(student);
        }
    })

    document.querySelector("#list tbody").appendChild(clone);
}

// Add or remove from inqSquad
function inqSquadClick(student, index) {

    if (student.inqSquad === true) {
        student.inqSquad = false;
    } else {
        if (systemSafety === false) {
            if (index === 0) {
                addStudentToInqSquad(student);
                index++;
                setTimeout(() => {
                    inqSquadClick(student, index)
                }, 1500);
            }
        } else {
            addStudentToInqSquad(student);
        }

    }
    displayList(filteredStudents);
}

// Add or remove as prefect
function prefectClick(student) {
    if (student.prefect === true) {
        student.prefect = false;
    } else {
        makeStudentPrefect(student);
    }
    displayList(filteredStudents);
}

function addStudentToInqSquad(selectedStudent) {

    if (selectedStudent.bloodStatus === "pure" || selectedStudent.house === "Slytherin") {
        selectedStudent.inqSquad = true;
    } else {
        selectedStudent.inqSquad = false;

        document.querySelector("#inq-squad-pop-up").style.visibility = "visible";
        document.querySelector("#close-inq-squad-pop-up").addEventListener("click", () => {
            document.querySelector("#inq-squad-pop-up").style.visibility = "hidden";
        })
        document.querySelector("#close-inq-squad").addEventListener("click", () => {
            document.querySelector("#inq-squad-pop-up").style.visibility = "hidden";
        })

    }
}

function makeStudentPrefect(selectedStudent) {

    const prefects = allStudents.filter(student => student.prefect === true);
    const prefsOfHouse = prefects.filter(student => student.house === selectedStudent.house);

    if (prefsOfHouse.length == 0) {
        selectedStudent.prefect = true;
    } else if (prefsOfHouse.length < 2) {
        if (prefsOfHouse[0].gender === selectedStudent.gender) {
            // Display error message
            document.querySelector(".assign-prefect-question").textContent = "You can ony choose one girl and one boy for each House";
            document.querySelector(".pop-up-background").style.visibility = "visible";
            document.querySelector("#assign-prefect-pop-up").style.visibility = "visible";
            document.querySelector("#prefect-student1").style.display = "flex";
            document.querySelector("#prefect-student1 img").src = prefsOfHouse[0].img;
            document.querySelector("#prefect-student1 .current-prefect").textContent = `${prefsOfHouse[0].firstname} ${prefsOfHouse[0].lastname}`;

            document.querySelector("#close-prefect-pop-up").addEventListener("click", () => {
                closePrefectPopUp();
            });

            document.querySelector("#close-prefect").addEventListener("click", () => {
                closePrefectPopUp();
            });

            selectedStudent.prefect = false;
        } else {
            selectedStudent.prefect = true;
        }
    } else {
        // Display error message
        document.querySelector(".assign-prefect-question").textContent = "Can't choose more than 2 prefects for each House";
        document.querySelector(".pop-up-background").style.visibility = "visible";
        document.querySelector("#assign-prefect-pop-up").style.visibility = "visible";
        // display student 1 
        document.querySelector("#prefect-student1").style.display = "flex";
        document.querySelector("#prefect-student1 img").src = prefsOfHouse[0].img;
        document.querySelector("#prefect-student1 .current-prefect").textContent = `${prefsOfHouse[0].firstname} ${prefsOfHouse[0].lastname}`;

        // display student 2
        document.querySelector("#prefect-student2").style.display = "flex";
        document.querySelector("#prefect-student2 img").src = prefsOfHouse[1].img;
        document.querySelector("#prefect-student2 .current-prefect").textContent = `${prefsOfHouse[1].firstname} ${prefsOfHouse[1].lastname}`;

        document.querySelector("#close-prefect-pop-up").addEventListener("click", () => {
            closePrefectPopUp();
        })

        document.querySelector("#close-prefect").addEventListener("click", () => {
            closePrefectPopUp();
        })

        selectedStudent.prefect = false;
    }
}

function closePrefectPopUp() {
    document.querySelector(".pop-up-background").style.visibility = "hidden";
    document.querySelector("#assign-prefect-pop-up").style.visibility = "hidden";
    document.querySelector("#prefect-student1").style.display = "none";
    document.querySelector("#prefect-student2").style.display = "none";
}

function displayStudentPopUp(student) {
    // make popUp visible
    document.querySelector(".student-tile").style.visibility = "visible";
    document.querySelector(".pop-up-background").style.visibility = "visible";

    // add studentDetails
    document.querySelector(".info-firstName").textContent = student.firstname;
    document.querySelector(".info-middleName").textContent = student.middlename;
    document.querySelector(".info-lastName").textContent = student.lastname;
    document.querySelector(".info-nickName").textContent = student.nickname;
    document.querySelector(".info-house").textContent = student.house;
    document.querySelector("#info-bstatus span").textContent = student.bloodStatus;
    document.querySelector("#student-photo").src = student.img;

    if (student.house === "Gryffindor") {
        document.querySelector("#house-flag").src = "assets/icons/gryffindor-flag-emblem.png";
        document.querySelector(".student-tile").style.backgroundColor = "#271616";
    } else if (student.house === "Hufflepuff") {
        document.querySelector("#house-flag").src = "assets/icons/hufflepuff-flag-emblem.png";
        document.querySelector(".student-tile").style.backgroundColor = "#202020";
    } else if (student.house === "Ravenclaw") {
        document.querySelector("#house-flag").src = "assets/icons/ravenclaw-flag-emblem.png";
        document.querySelector(".student-tile").style.backgroundColor = "#0f1929";
    } else {
        document.querySelector("#house-flag").src = "assets/icons/slytherin-flag-emblem.png";
        document.querySelector(".student-tile").style.backgroundColor = "#002506";
    }

    // add interactions
    if (student.expelled) {
        studentIsExpelled();
    } else {
        document.querySelector("#expell-button").style.visibility = "visible";
        document.querySelector(".inqSquadInfo").style.visibility = "visible";
        document.querySelector(".prefectInfo").style.visibility = "visible";
        document.querySelector("#expelled").style.visibility = "hidden";

        document.querySelector("#expell-button").addEventListener("click", () => {
            isStudentExpelled(student);
        })
    }

    // Display if member of the Inquisitorial Squad
    if (student.inqSquad) {
        document.querySelector(".inqSquadInfo .icon").style.opacity = '1';
        document.querySelector(".inqSquadInfo p").textContent = 'Member of the Inquisitorial Squad';
    } else {
        document.querySelector(".inqSquadInfo .icon").style.opacity = '0.3';
        document.querySelector(".inqSquadInfo p").textContent = 'Not a member of the Inquisitorial Squad';
    }

    // Display if prefect
    if (student.prefect) {
        document.querySelector(".prefectInfo .icon").style.opacity = '1';
        document.querySelector(".prefectInfo p").innerHTML = `Prefect of <span id="prefectOf">${student.house}</span>`;
    } else {
        document.querySelector(".prefectInfo .icon").style.opacity = '0.3';
        document.querySelector(".prefectInfo p").innerHTML = `Not a prefect`;
    }

    document.querySelector(".close-button img").addEventListener("click", closePopUp);
}

function isStudentExpelled(student) {

    document.querySelector("#expell-student-pop-up").style.visibility = "visible";
    document.querySelector("#expell-student").textContent = `${student.firstname} ${student.lastname}?`;

    document.querySelector("#close-pop-up").addEventListener("click", () => {
        document.querySelector("#expell-student-pop-up").style.visibility = "hidden";
    });

    document.querySelector(".no-button").addEventListener("click", () => {
        document.querySelector("#expell-student-pop-up").style.visibility = "hidden";
    });

    document.querySelector(".yes-button").addEventListener("click", () => {
        if (student.firstname !== "Lucian" && student.lastname !== "Aionicesei") {
            expellStudentApproved(student);
            document.querySelector("#expell-student-pop-up").style.visibility = "hidden";
            studentIsExpelled();
        } else {
            document.querySelector("#expell-student-pop-up").style.visibility = "hidden";
        }
    })
}

function expellStudentApproved(selectedStudent) {

    if (!expelledStudents.includes(selectedStudent)) {
        expelledStudents.push(selectedStudent);
        selectedStudent.expelled = true;
        selectedStudent.prefect = false;
        selectedStudent.inqSquad = false;
        filteredStudents.splice(filteredStudents.indexOf(selectedStudent), 1);
        displayList(filteredStudents);
    }
}

function studentIsExpelled() {
    document.querySelector("#expell-button").style.visibility = "hidden";
    document.querySelector(".inqSquadInfo").style.visibility = "hidden";
    document.querySelector(".prefectInfo").style.visibility = "hidden";
    document.querySelector("#expelled").style.visibility = "visible";
}

function closePopUp(element) {
    let popUpWindow = element.target.parentElement.parentElement;
    popUpWindow.style.visibility = "hidden";
    document.querySelector(".pop-up-background").style.visibility = "hidden";
    document.querySelector("#expell-button").style.visibility = "hidden";
    document.querySelector("#expell-button").style.visibility = "hidden";
    document.querySelector(".inqSquadInfo").style.visibility = "hidden";
    document.querySelector(".prefectInfo").style.visibility = "hidden";
    document.querySelector("#expelled").style.visibility = "hidden";
}

function filterList() {

    let filterByStatus = document.querySelector("#filter-students").value;
    let filterByHouse = document.querySelector("#filter-houses").value;
    let filterByClubs = document.querySelector("#filter-clubs").value;

    if (filterByStatus === "prefect") {
        filteredStudents = allStudents.filter((student) => student.prefect);
    } else if (filterByStatus === "inqSquad") {
        filteredStudents = allStudents.filter((student) => student.inqSquad);
    } else if (filterByStatus === "expelled") {
        filteredStudents = expelledStudents;
    } else {
        filteredStudents = allStudents;
    }

    if (filterByHouse != "allhouses") {
        filteredStudents = filteredStudents.filter(isHouse);
    }

    if (filterByClubs != "allclubs") {
        filteredStudents = filteredStudents.filter(isClub);
    }

    function isHouse(student) {
        if (student.house === filterByHouse) {
            return true;
        } else {
            return false;
        }
    }

    function isClub(student) {
        if (student.clubs.includes(filterByClubs)) {
            return true;
        } else {
            return false;
        }
    }

    displayList(filteredStudents);
}

function searchFieldInput(evt) {
    // write to the list with only those elemnts in the filteredStudents array that has properties containing the search frase
    displayList(
        filteredStudents.filter((elm) => {

            // comparing in uppercase so that m is the same as M

            if (evt.target.value.includes(" ")) {
                let searchName = namesWithCapLetters(evt.target.value).split(" ");
                let firstName = searchName[0];
                let lastName = searchName[1] || "";

                if (searchName.length < 3) {
                    return elm.firstname.toUpperCase().includes(firstName.toUpperCase()) && elm.lastname.toUpperCase().includes(lastName.toUpperCase()) || elm.firstname.toUpperCase().includes(lastName.toUpperCase()) && elm.lastname.toUpperCase().includes(firstName.toUpperCase());
                } else {
                    return;
                }
            } else {
                return elm.firstname.toUpperCase().includes(evt.target.value.toUpperCase()) || elm.lastname.toUpperCase().includes(evt.target.value.toUpperCase());
            }
        })
    );
}

function sort(buttonElm) {
    let sortBy;
    let orderBy;
    let direction = 1;

    sortBy = buttonElm.target.getAttribute("data-sort");
    orderBy = buttonElm.target.getAttribute("data-sort-direction");

    if (orderBy === "asc") {
        buttonElm.target.dataset.sortDirection = "desc";
    } else {
        buttonElm.target.dataset.sortDirection = "asc";
    }

    if (orderBy === "asc") {
        direction = 1;
    } else {
        direction = -1;
    }

    console.log(sortBy);
    console.log(orderBy);
    console.log(filteredStudents);

    filteredStudents.sort(compareProperty);
    displayList(filteredStudents);


    function compareProperty(a, b) {
        if (a[sortBy] < b[sortBy]) {
            return -1 * direction;
        } else {
            return 1 * direction;
        }
    }
}

function displayListInfo(students) {

    let totalGryffindor = allStudents.filter(student => student.house === "Gryffindor");
    let totalHufflepuff = allStudents.filter(student => student.house === "Hufflepuff");
    let totalRavenclaw = allStudents.filter(student => student.house === "Ravenclaw");
    let totalSlytherin = allStudents.filter(student => student.house === "Slytherin");

    document.querySelector("#house-gryffindor .student-number").textContent = totalGryffindor.length;
    document.querySelector("#house-hufflepuff .student-number").textContent = totalHufflepuff.length;
    document.querySelector("#house-ravenclaw .student-number").textContent = totalRavenclaw.length;
    document.querySelector("#house-slytherin .student-number").textContent = totalSlytherin.length;

    document.querySelector("#totalStudents span").textContent = allStudents.length;
    document.querySelector("#currently-displayed span").textContent = students.length;
    document.querySelector("#students-expelled span").textContent = expelledStudents.length;
}

function hackTheSystem() {

    if (systemSafety === true) {

        const me = {
            firstname: "Lucian",
            lastname: "Aionicesei",
            middlename: "Alexandru",
            nickname: "Best Student",
            gender: "boy",
            img: "assets/icons/aionicesei_l.png",
            house: "Gryffindor",
            prefect: false,
            inqSquad: false, //Inquisitorial squad
            clubs: ["It Club"],
            expelled: false,
            bloodStatus: "kryptonian"
        }

        filteredStudents.unshift(me);

        let bloodStatuses = ["pure", "half", "muggle"]
        filteredStudents.forEach(student => {
            if (student.bloodStatus === "half" || student.bloodStatus === "muggle") {
                student.bloodStatus = "pure";
                student.inqSquad = false;
            } else if (student.bloodStatus === "kryptonian") {
                student.bloodStatus = "kryptonian"
            } else {
                let randomNumber = Math.floor(Math.random() * 3);
                student.bloodStatus = bloodStatuses[randomNumber];
                student.inqSquad = false;
            }
        });

        displayList(filteredStudents);

        systemSafety = false;
    } else {
        return
    }

}