'use strict';

class EmployeeDTO {
    constructor(age, id) {
        this.age = age;
        this.id = id;
        this.isFired = false;
        this.isHired = true;
        this.rank = age;
    }
}

module.exports.EmployeeDTO = EmployeeDTO;
