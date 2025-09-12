import { StyleSheet } from "react-native";
import Colors from "../constants/Colors";

export const GlobalStyles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  // Card styles
  card: {
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Text styles
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    opacity: 0.8,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },

  // Form styles
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    fontSize: 16,
  },

  // Button styles
  button: {
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  buttonPrimary: {
    backgroundColor: Colors.light.tint,
  },
  buttonSecondary: {
    backgroundColor: "#6c757d",
  },
  buttonDanger: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonOutline: {
    borderWidth: 2,
    backgroundColor: "transparent",
  },

  // Helper styles
  divider: {
    height: 1,
    width: "100%",
    marginVertical: 20,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },

  // Animation related
  fadeIn: {
    opacity: 1,
    transition: "opacity 0.3s ease-in",
  },
  fadeOut: {
    opacity: 0,
    transition: "opacity 0.3s ease-out",
  },

  // Utility styles
  mt10: { marginTop: 10 },
  mt20: { marginTop: 20 },
  mb10: { marginBottom: 10 },
  mb20: { marginBottom: 20 },
  p10: { padding: 10 },
  p20: { padding: 20 },
});
