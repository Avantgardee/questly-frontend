import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  shadows: ["none"],
  palette: {
    primary: {
      main: "#00684a",
    },
    out:{
      main: "#001e2b",
    },
    secondary:{
      main: "#626177",
    }
  },
  typography: {
    fontFamily: 'Montserrat, sans-serif',

    button: {
      textTransform: "none",
      fontWeight: 400,
    },
  },
});
