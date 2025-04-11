import { LoadScript } from "@react-google-maps/api"
import PropTypes from "prop-types"

const GoogleMapLoader = ({ children }) => {
  return <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>{children}</LoadScript>
}

GoogleMapLoader.propTypes = {
  children: PropTypes.node.isRequired,
}

export default GoogleMapLoader
