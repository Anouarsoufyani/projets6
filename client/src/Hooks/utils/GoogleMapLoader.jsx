import { LoadScript } from "@react-google-maps/api"
import PropTypes from "prop-types"

const GoogleMapLoader = ({ children }) => {

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "AIzaSyD9buKfiAVASpx1zzEWbuSyHI05CaJyQ6c"

  return <LoadScript googleMapsApiKey={apiKey}>{children}</LoadScript>
}

GoogleMapLoader.propTypes = {
  children: PropTypes.node.isRequired,
}

export default GoogleMapLoader
