<script lang="ts">
    import {auth,db}  from "$lib/firebase";
    import {signOut,onAuthStateChanged,updateProfile} from "firebase/auth";
    import {doc,setDoc,getDoc} from "firebase/firestore";
    import {goto} from "$app/navigation";
    import {onMount} from "svelte";
    import { GraphQLClient, gql } from "graphql-request";
    import {browser} from "$app/environment"
    import {favorites} from "$lib/stores/favorites"

    // variable declaration
    let userName="user";
    let profilePhoto:string|null=null;
    let dropdownOpen=false;
    let loading=true;
    let unsubscribeAuth:(()=>void)|null=null;
    // Fetching
    let pokemons:any[]=[];
    let error:string|null=null;

    // searching & Filtering
    let searchTerm="";
    let selectedType:string|null=null;
    let pokemonTypes=['normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug',
                      'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic',
                      'ice', 'dragon', 'dark', 'fairy'];
    let selectedPokemon:any=null;

                        // FUNCTIONS
    // Profile dropdown control
    function handleDropdown(){
        dropdownOpen=!dropdownOpen;
    }

    // First Letter for Profile
    $: firstLetter=userName.charAt(0).toUpperCase();

    // Image select + Save + Upload
    async function handleProfilePhoto(e:Event) {
        const input=e.target as HTMLInputElement;
        if(!input.files || !input.files[0] || !auth.currentUser)return;
            const file=input.files[0];
            const reader=new FileReader();
            reader.onload=async ()=>{
                const img=reader.result as string;
                profilePhoto=img;

                const uid=auth.currentUser!.uid;
                const docRef=doc(db,"user",uid)

                await setDoc(docRef,{photoURL:img},{merge:true});
                await updateProfile(auth.currentUser!,{photoURL:img});
            };
            reader.readAsDataURL(file);
    }

    // Profile dropdown close
    async function handleDropdownClose(e:MouseEvent) {
      if(!browser) return;
        const dropdown=document.getElementById("profile-dropdown");
        const button=document.getElementById("profile-button");
        if(dropdown&&button&&!dropdown.contains(e.target as Node)&&!button.contains(e.target as Node)){
            dropdownOpen=false;
        }
    }

    // Load Profile
    onMount(()=>{
      if(!browser) return;
        unsubscribeAuth=onAuthStateChanged(auth,async (user)=>{
            loading=true;
            try {
              if (user) {
                userName = user.displayName || user.email?.split("@")[0] || "User";

                // Get doc from Firestore
                const docRef = doc(db, "users", user.uid);
                const snap = await getDoc(docRef);

                if (snap.exists() && snap.data()?.photoURL) {
                  profilePhoto = snap.data().photoURL as string;
                } else if (user.photoURL) {
                  // fallback to auth profile if present
                  profilePhoto = user.photoURL;
                } else {
                  profilePhoto = null;
                }
              } else {
                // Not logged in
                userName = "User";
                profilePhoto = null;
              }
            } catch (err) {
              console.error("Error loading profile from Firestore:", err);
            } finally {
              loading = false;
            }
          });
          document.addEventListener("click",handleDropdownClose);
          fetchPokemons();
          return removeEventListener("click",handleDropdownClose);
        });

    //LogOut
    async function handleLogout() {
      if(!browser || !auth)return;
        try {
            await signOut(auth);
            goto("/login");
        } catch (error) {
            console.error("Logout error:",error);
        }
    }

    // Fetch Pokemon Dataset using GraphQL
    // GraphQL Client
    const client = new GraphQLClient("https://beta.pokeapi.co/graphql/v1beta");
    async function fetchPokemons() {
        loading = true;
        error = null;

        try {
          const query = gql`
            query {
              pokemon_v2_pokemon(limit: 1000) {
                id
                name
                pokemon_v2_pokemontypes {
                  pokemon_v2_type { name }
                }
                pokemon_v2_pokemonabilities {
                  pokemon_v2_ability { name }
                }
                pokemon_v2_pokemonstats {
                  base_stat
                  pokemon_v2_stat { name }
                }
              }
            }
          `;

          const data:any = await client.request(query);

          pokemons = data.pokemon_v2_pokemon.map((p: any) => ({
            id: p.id,
            name: p.name,
            sprites: {
              front_default: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
            },
            types: p.pokemon_v2_pokemontypes.map((t: any) => t.pokemon_v2_type.name) ,
            
            abilities: p.pokemon_v2_pokemonabilities.map((a: any) =>a.pokemon_v2_ability.name),
            stats: p.pokemon_v2_pokemonstats.map((s: any) => ({
              name: s.pokemon_v2_stat.name,
              base_stat: s.base_stat
            }))
          }));
        } catch (err: any) {
          console.error("Failed to fetch Pokémon",err);
        } finally {
          loading = false;
        }
      }

      // Searching and Filtering
      $: filteredPokemons=pokemons.filter((p:any)=>{
        const matchesName=p.name.toLowerCase().includes(searchTerm.toLocaleLowerCase());
        const matchesType=selectedType?p.types.includes(selectedType) :true;
        return matchesName && matchesType;
      });

      // Details open fun
      function openSelectedPokemon(p:any){
        selectedPokemon=p;
      }
      // Details close fun
      function closeSelectedPokemon(){
        selectedPokemon=null;
      }
       // Handle Favorites
      function handleFavorite(pokemonId: number) {
        favorites.update((list)=>{
          if (list.includes(pokemonId)) {
          return list.filter((id) => id !== pokemonId);
        } else {
          return[...list, pokemonId];
        }
        });
      }

</script>
<nav class="flex justify-between items-center px-6 py-3 absolute top-0 left-0 w-full bg-black text-white">
    <h1 class="font-extrabold text-xl">POKEDEX</h1>
    <div class="flex items-center space-x-6">
        <a href="/dashboard" class="hover:text-yellow-300 text-medium" on:click={()=>location.reload()}>Pokemons</a>
        <a href="/favorites" class="hover:text-yellow-300 text-medium">Favoirites</a>
        <a href="/aboutus" class="hover:text-yellow-300 text-medium">About Us</a>

        <div class="relative max-w-lg">
            <button id="profile-button" class="flex items-center space-x-2 max-w-lg" on:click={handleDropdown}>
                {#if profilePhoto}
                    <img src={profilePhoto} alt="profile" class="flex items-center justify-center rounded-full h-8 w-8 bg-cover object-cover"/>
                {:else}
                <span class="flex items-center justify-center rounded-full h-8 w-8 font-bold bg-yellow-400 text-black">{firstLetter}</span>
                {/if}
                <span class="hover:text-yellow-300">Profile</span>
            </button>
            {#if dropdownOpen}
            <div id="profile-dropdown" class="absolute right-0 mt-2 bg-black bg-opacity-90 rounded-md text-white z-50">
                <div class="px-4 py-3 border-b max-w-lg border-yellow-300">
                    <div class="flex items-center space-x-3">
                        {#if profilePhoto}
                            <img src={profilePhoto} alt="Profile" class="flex items-center max-w-lg justify-center rounded-full h-10 w-10 bg-cover object-cover"/>
                        {:else}
                            <span class="flex items-center justify-center rounded-full h-10 w-10 font-bold bg-yellow-400 text-xl text-black">{firstLetter}</span>
                        {/if}
                        <div>
                            <span class="font-bold">{userName}</span>
                            <a href="https://{auth.currentUser!.email}" class="hover:underline text-yellow-300 text-xs">{auth.currentUser!.email}</a>
                        </div>
                    </div>
                </div>
                <label for="photo-change" class="block px-4 py-2 text-center hover:text-black hover:bg-yellow-300 text-sm">
                    Change Profile
                </label>
                <input id="photo-change" type="file" accept="image/*" class="hidden" on:change={handleProfilePhoto}>
                <button on:click={handleLogout} class="block px-4 py-3 w-full text-red-500 hover:bg-yellow-300 hover:text-black">
                    Log Out
                </button>
            </div>
            {/if}         
        </div>
    </div>
</nav>

<!--Pkemon Grid-->
<div class="p-10 mt-10 bg-red-100">
  <div class="flex justify-between items-center">
    <input
      type="text"
      placeholder="Search by Name"
      bind:value={searchTerm}
      class="w-full mt-10 md:w-1/3"/>

    <div class=" md:w-1/3">
      <select 
        bind:value={selectedType}
        class="w-full mt-10 px-10">
        <option value={null} disabled selected>Filter by Type</option>
        {#each pokemonTypes as type}
          <option value={type} class="capitalize">{type}</option>
        {/each}

      </select>
    </div>
  </div>
    {#if error}
    <h class="text-red-500 font-bold">{error}</h>
    {:else if loading}
    <div class="text-center"><h class="text-black-500 font-extrabold text-bold text-center">Loading Pokemons.....</h></div>
    {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {#each filteredPokemons as p }
            <div role="button" 
                tabindex="0"
                on:click={() => openSelectedPokemon(p)}
                on:keydown={(e) => e.key === 'Enter' && openSelectedPokemon(p)}
                class="relative bg-black/70 flex flex-col items-center text-white hover:scale-105 rounded-xl p-4 mt-4 ">
                <img src={p.sprites.front_default} alt={p.name} class="h-25 w-25 mb-0.2" />
                <h2 class="capitalize font-bold">{p.name}</h2>
                <p >#{p.id}</p>
                <div class="flex space-x-2 mt-2">
                  {#each p.types as t}
                    <span class="px-3 py-1 text-xs rounded bg-yellow-200 text-black">{t}</span>
                  {/each}
                </div>
                <!-- Heart Button -->
                <button
                  class="absolute bottom-2 right-2 text-3xl"
                  on:click|stopPropagation={() => handleFavorite(p.id)}>
                  <span class={$favorites.includes(p.id) ? "text-red-500" : "text-white-400"}>&hearts;</span>
                </button>
              </div>
        {/each}
    </div>
    {/if}
</div>

<!--Selected pokemon Details Grid-->
{#if selectedPokemon}
  <div class="fixed inset-0 flex justify-center items-center bg-red-100">
    <div class="relative w-full p-6 bg-black/50 border max-w-lg">
      <button class="absolute top-2 right-3 px-2 py-1 text-3xl text-red-600 border bg-pink-300  text-center hover:bg-black " on:click={closeSelectedPokemon}>X</button>
      <img src={selectedPokemon.sprites.front_default} alt="pokemon" class="mx-auto h-30 w-30 "/>
      <h1 class="text-center font-bold">{selectedPokemon.name}</h1>
      <p class="text-center">#{selectedPokemon.id}</p>
      <h2 class="font-bold mb-3 ">Types :-</h2>
      <div class="space-x-2 mb-4">
        {#each selectedPokemon.types as t}
        <span class="px-3 py-1 rounded-lg bg-yellow-200 border space-x-2">{t}</span>
      {/each}
      </div>
      <h class="font-bold">Abilities:-</h>
      {#each selectedPokemon.abilities as a}
        <ul class="list-disc list-inside">
          <li>{a}</li>
        </ul>
      {/each}
      <h class="font-bold">Stats:-</h>
      {#each selectedPokemon.stats as s}
        <ul class="list-disc list-inside">
          <li>{s.name} : {s.base_stat}</li>
        </ul>
      {/each}

       <!-- Heart Button  -->
      <button
        class="absolute bottom-4 right-4 text-3xl"
        on:click={() => handleFavorite(selectedPokemon.id)}>
        <span class= {$favorites.includes(selectedPokemon.id) ? "text-red-500" : "text-white"} >&hearts;</span>
      </button>
    </div>
  </div>
{/if}