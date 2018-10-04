//const searchAPI = 'http://localhost:7071/api/searchCharacters?name=';
//const coverAPI = 'http://localhost:7071/api/getCharacterCovers?id=';
const searchAPI = 'https://marvelcomicchar.azurewebsites.net/api/searchCharacters?name=';
const coverAPI = 'https://marvelcomicchar.azurewebsites.net/api/getCharacterCovers?id=';

const app = new Vue({
	el:'#app',
	data:{
		needCharacter:true,
		character:'',
		characterSearching:false,
		noCharacters:false,
		characters:[],
		loadingCharacter:false,
		loadingCovers:true,
		covers:[],
		noCovers:false
	},
	methods:{
		search:function(event) {
      if(event) event.preventDefault()
			if(this.character === '') return;
			console.log('search for '+this.character);
			this.noCharacters = false;
			this.characterSearching = true;
			fetch(searchAPI+encodeURIComponent(this.character))
			.then(res => res.json())
			.then(res => {
				this.characterSearching = false;
				if(res.length === 0) this.noCharacters = true;
				console.log(res);
				this.characters = res;
			});
		},
		loadChar:function(c) {
			console.log('load', c.id, c.name);
			this.needCharacter = false;
			this.loadingCharacter = true;
			fetch(coverAPI+encodeURIComponent(c.id))
			.then(res => res.json())
			.then(res => {
				this.loadingCovers = false;
				if(res.length === 0) this.noCovers = true;
				//console.log(res);
				// todo, remove http://i.annihil.us/u/prod/marvel/i/mg/b/40/image_not_available.jpg
				this.covers = res.result;
			});

		}
	}
});
