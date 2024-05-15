import axios from "axios";

const request = axios.create({
	baseURL: process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : 'https://hypno-club.onrender.com/api',
})

export default request;