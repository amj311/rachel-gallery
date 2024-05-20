import axios from "axios";

export const apiUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5000/api' : 'https://hypno-club.onrender.com/api';

const request = axios.create({
	baseURL: apiUrl,
})

export default request;