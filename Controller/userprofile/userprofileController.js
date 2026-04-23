const connection = require("../../Model/dbConnect");
const getUserProfile = (req, res) => {
  const query = "SELECT * FROM userprofile";
  connection.query(query, (err, result) => {
    if (err) return res.status(500).send("DB Error");
    res.json(result); 
  });
};

const getbyUserid = (req, res) => {
  const { userid } = req.params;
  if (!userid) return getUserProfile(req, res);

  const query = "SELECT * FROM userprofile WHERE userid = ?";
  connection.query(query, [userid], (err, result) => {
    if (err) return res.status(500).send("DB Error");
    res.json(result); 
  });
};

// Insert User Profile 
const postUserProfile = (req, res) => {
  const {profile_photo, aadhar_profile_photo,qualification_photo,} = req.files || {};
  const {pid,userid,qualification,aadhar,phone,pan_no,address,state,city,pincode,email,} = req.body;

    const data = {
    pid,
    userid,
    qualification, 
    aadhar,
    phone,
    pan_no,
    address,
    state,
    city,
    pincode,
    email,
    profile_photo: profile_photo
      ? profile_photo[0].filename
      : null,
    aadhar_profile_photo: aadhar_profile_photo
      ? aadhar_profile_photo[0].filename
      : null,
    qualification_photo: qualification_photo
      ? qualification_photo[0].filename
      : null,
  };

  const query = "INSERT INTO userprofile SET ?";
  connection.query(query, data, (err, result) => {
    if (err) {
      console.log("Error:", err.sqlMessage);
      if (err.code === "ER_DUP_ENTRY") {
        return res
          .status(400)
          .send("Duplicate entry: Aadhar or Email already exists");
      }
      return res.status(500).send("DB Error");
    }
    console.log("User Profile Inserted Successfully");
    res.send(result);
  });
};

module.exports = { getUserProfile, getbyUserid, postUserProfile };

