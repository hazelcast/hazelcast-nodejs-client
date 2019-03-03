var UsernamePasswordCredentials = require('./user_pass_cred');

function UsernamePasswordCredentialsFactory() {
}

UsernamePasswordCredentialsFactory.prototype.create = function (classId) {
    if(classId === 1){
        return new UsernamePasswordCredentials();
    }
    return null;
};

exports.UsernamePasswordCredentialsFactory = UsernamePasswordCredentialsFactory;
