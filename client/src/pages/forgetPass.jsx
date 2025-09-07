import * as React from 'react';
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

import {
  Button,
  FormControl,
  InputLabel,
  OutlinedInput,
  TextField,
  InputAdornment,
  Link,
  Alert,
  IconButton,
  Typography,
  Box,
  Snackbar
} from '@mui/material';

import AccountCircle from '@mui/icons-material/AccountCircle';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { AppProvider } from '@toolpad/core/AppProvider';
import { useTheme } from '@mui/material/styles';

function CustomEmailField({ value, onChange }) {
  return (
    <TextField
      id="input-with-icon-textfield"
      label="Email"
      name="email"
      value={value}
      onChange={onChange}
      type="email"
      size="small"
      required
      fullWidth
      sx={{ my: 1 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <AccountCircle fontSize="inherit" />
          </InputAdornment>
        ),
      }}
      variant="outlined"
    />
  );
}

function CustomButton({name,task,Visibility=false}) {
  return (
    <Button type="submit" onClick={task} variant="contained" color="primary" sx={{ my: 2 }} disabled={Visibility}>
      {name}
    </Button>
  );
}

function CustomPasswordField({ value, onChange }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => event.preventDefault();

  return (
    <FormControl sx={{ my: 1 }} fullWidth variant="outlined">
      <InputLabel size="small" htmlFor="outlined-adornment-password">
        Password
      </InputLabel>
      <OutlinedInput
        id="outlined-adornment-password"
        type={showPassword ? 'text' : 'password'}
        name="password"
        value={value}
        onChange={onChange}
        size="small"
        required
        endAdornment={
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPassword}
              onMouseDown={handleMouseDownPassword}
              edge="end"
              size="small"
            >
              {showPassword ? <VisibilityOff fontSize="inherit" /> : <Visibility fontSize="inherit" />}
            </IconButton>
          </InputAdornment>
        }
        label="Password"
      />
    </FormControl>
  );
}

function CustomOTPField({ value, onChange }) {
  return (
    <TextField
      id="input-with-icon-otp"
      label="OTP"
      name="otp"
      value={value}
      onChange={onChange}
      type="text"
      size="small"
      required
      fullWidth
      sx={{ my: 1 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <AccountCircle fontSize="inherit" />
          </InputAdornment>
        ),
      }}
      variant="outlined"
    />
  );
}

export default function ForgetPass() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isverified, setIsVerified] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("success");
  const [disabled, setDisabled] = useState(false);
  
  const disableButton = () => {
    setDisabled(true);
    setTimeout(() => setDisabled(false), 30000); 
  }

  const handleResendOTP = async (e) => {
    e.preventDefault();
    if (!email) {
      setAlertMessage("Please enter your email.");
      setAlertSeverity("error");
      setOpen(true);
      return;
    }
    try {
      const response = await api.post("/auth/send-verification-code", {email});
      setAlertMessage("OTP Sent successfully.");
      setAlertSeverity("success");
      setOpen(true);
      disableButton();
    } catch (err) {
      setAlertMessage(err.response?.data?.msg || "Sending OTP failed. Please try again.");
      setAlertSeverity("error");
      setOpen(true);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setAlertMessage("Passwords do not match.");
      setAlertSeverity("error");
      setOpen(true);
      return;
    }
    try {
        const response =await api.post("/auth/reset-password", { email, newPassword });
        setAlertMessage(response.data.msg);
        setAlertSeverity("success");
        setOpen(true);
        setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
        setAlertMessage(err.response?.data?.msg || "Password reset failed. Please try again.");
        setAlertSeverity("error");
        setOpen(true);
    }
  }

  const passwordMatchMessage = () => {
    if (!newPassword || !confirmPassword) return null;

    return newPassword === confirmPassword ? (
      <p style={{ color: 'green' }}>Passwords match</p>
    ) : (
      <p style={{ color: 'red' }}>Passwords do not match</p>
    );
  };


   const handleVerifyOTP= async(e)=>{
    e.preventDefault();
    try {
      const response = await api.post("/auth/verify", { verificationCode: otp });
      setAlertMessage(response.data.msg);
      setAlertSeverity("success");
      setOpen(true);
      setIsVerified(true);
    } catch (err) {
      setAlertMessage(err.response?.data?.msg || "Verification failed. Please try again.");
        setAlertSeverity("error");
      setOpen(true);
    }
  };


  return (
    <AppProvider theme={theme}>
      <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                bgcolor: 'background.default'
              }}
            >
              <Box
                sx={{
                  p: 4,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  boxShadow: 3,
                  maxWidth: 400,
                  width: '100%',
                  bgcolor: 'background.paper'
                }}
              >
        <form noValidate>
        <Typography variant="h4" gutterBottom>
          Forgot Password
        </Typography>
        <CustomEmailField value={email} onChange={(e) => setEmail(e.target.value)} />
        <CustomButton name="Send OTP" task={handleResendOTP} Visibility={disabled} />
        <CustomOTPField value={otp} onChange={(e) => setOtp(e.target.value)} />
        <CustomButton name="Verify" task={handleVerifyOTP} />

        </form> 
         {isverified && (
        <form noValidate>
        <CustomPasswordField value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <CustomPasswordField value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        {passwordMatchMessage()}
        <CustomButton name="Reset Password" task={handleResetPassword}  />
        </form>
        )}
        </Box>
        <Snackbar open={open}
        autoHideDuration={3000}
        onClose={() => setOpen(false)}
        anchorOrigin={{vertical:"top",horizontal:"center"}}>
        <Alert onClose={() => setOpen(false)} severity={alertSeverity} sx={{ width: '100%' }}>
          {alertMessage}
        </Alert>
      </Snackbar>
      </Box>
    </AppProvider>
  );

}

