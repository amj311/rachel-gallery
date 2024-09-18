import { defineStore } from 'pinia'
import request from '@/services/request';

type Portfolio = {
	sections: PortfolioSection[]
}

type PortfolioSection = {
	id: string;
	type: string;
	name: string;
	order: number;
	photos: any[];
} & any;

export const usePortfolioStore = defineStore('Portfolio', {
	state: () => ({
		portfolio: null as null | Portfolio,
		isLoading: false,
	}),
	getters: {
		
	},
	actions: {
		async loadPortfolio() {
			try {
				this.isLoading = true;
				const { data } = await request.get('/portfolio')
				this.portfolio = data.data;
			}
			catch (e) {
				console.log(e);
			}
			finally {
				this.isLoading = false;
			}
		}
	},
});
