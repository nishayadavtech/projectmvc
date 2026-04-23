const connection = require('../../Model/dbConnect');
const getrole = (req, res) => {
    
    let query = 'SELECT * FROM role';
    connection.query(query, function(error, result){
        if(error){
            console.log("Error", error.sqlMessage);
        }
        else{
            res.send(result);
        }
    })
}

const postrole = (req, res) => {
    const data = req.body;

    const query = "INSERT INTO role SET ?";
    connection.query(query, data, function(error, result) {
       if(error){
            console.log("Error", error.sqlMessage);
        
        }
        else{
            res.send(result);
        }
    })
}


module.exports = {getrole, postrole}



