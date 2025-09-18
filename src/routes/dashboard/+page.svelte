<script lang="ts">
    import {auth}  from "$lib/firebase";
    import {signOut,onAuthStateChanged,updateProfile} from "firebase/auth";
    import {goto} from "$app/navigation";
    import {browser} from "$app/environment"
    import {fetchPokemons} from "$lib/stores/favorites"
    import Heartbutton from "$lib/components/heartbutton.svelte";
  // variable declaration
    let userName= $state("User");
    let profilePhoto= $state <string|null>(null);
    let dropdownOpen= $state(false);
    let loading= $state(true);
    // Fetching
    let pokemons= $state <any[]> ([]);
    let error= $state <string|null> (null);
    // searching & Filtering
    let searchTerm= $state("");
    let selectedType= $state <string|null> (null);
    const pokemonTypes= ['normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug',
                      'ghost', 'steel', 'fire', 'water', 'grass', 'electric', 'psychic',
                      'ice', 'dragon', 'dark', 'fairy'];
    let selectedPokemon= $state <any>(null);

    // FUNCTIONS
    // Profile dropdown control
    function handleDropdown(){
        dropdownOpen=!dropdownOpen;
    }
    // First Letter for Profile
    
    let firstLetter = $derived(() =>  userName.charAt(0).toUpperCase());
    // svelte-ignore state_referenced_locally
        console.log(firstLetter());

    // Image select + Save + Upload
    async function handleProfilePhoto(e:Event) {
        const input=e.target as HTMLInputElement;
        if(!input.files || !input.files[0] || !auth.currentUser)return;
            const file=input.files[0];
            const reader=new FileReader();
            reader.onload=async ()=>{
                const img=reader.result as string;
                profilePhoto=img;
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

    //Fetching pokemons
    async function loadPokemons() {
      loading=true;
      error=null;
      try {
        pokemons= await fetchPokemons();
      } catch (err:any) {
        console.error("Failed to fetch pokemons",err);
        error="Failed to fetch pokemons";
      }finally{
        loading=false;
      }
    }
    // Load Profile
    $effect(()=>{
      if(!browser) return;
        onAuthStateChanged(auth,async (user)=>{
            try {
              loading=true;
              if (user) {
                userName = user.displayName || user.email?.split("@")[0] || "User";
              }
              await loadPokemons();
            } catch (err) {
              console.error("Error loading profile from Firestore:", err);
            } finally {
              loading = false;
            }
          });
          document.addEventListener("click",handleDropdownClose);
          return ()=>{ 
            document.removeEventListener("click",handleDropdownClose);
          }
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
      // Searching and Filtering
      let filteredPokemons= $derived (pokemons.filter((p:any)=>{
        const matchesName=p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType=selectedType?p.types.includes(selectedType) :true;
        return matchesName && matchesType;
      }))

      // Details open fun
      function openSelectedPokemon(p:any){
        selectedPokemon=p;
      }
      // Details close fun
      function closeSelectedPokemon(){
        selectedPokemon=null;
      }
      

</script>
<nav class="flex justify-between items-center px-6 py-3 absolute top-0 left-0 w-full bg-black text-white">
    <h1 class="font-extrabold text-xl">POKEDEX</h1>
    <div class="flex items-center space-x-6">
        <!-- svelte-ignore event_directive_deprecated -->
        <a href="/dashboard" class="hover:text-yellow-300 text-medium" on:click={()=>location.reload()}>Pokemons</a>
        <a href="/favorites" class="hover:text-yellow-300 text-medium">Favorites</a>
        <a href="/aboutus" class="hover:text-yellow-300 text-medium">About Us</a>

        <div class="relative max-w-lg">
            <!-- svelte-ignore event_directive_deprecated -->
            <button id="profile-button" class="flex items-center space-x-2 max-w-lg" on:click={handleDropdown}>
                {#if profilePhoto}
                    <img src={profilePhoto} alt="profile" class="flex items-center justify-center rounded-full h-8 w-8 bg-cover object-cover"/>
                {:else}
                <span class="flex items-center justify-center rounded-full h-8 w-8 font-bold bg-yellow-400 text-black">{firstLetter()}</span>
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
                            <span class="flex items-center justify-center rounded-full h-10 w-10 font-bold bg-yellow-400 text-xl text-black">{firstLetter()}</span>
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
                <!-- svelte-ignore event_directive_deprecated -->
                <input id="photo-change" type="file" accept="image/*" class="hidden" on:change={handleProfilePhoto}>
                <!-- svelte-ignore event_directive_deprecated -->
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
            <!-- svelte-ignore event_directive_deprecated -->
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div role="button"
                class="relative bg-black/70 flex flex-col items-center text-white hover:scale-105 rounded-xl p-4 mt-4 "
                on:click={() => openSelectedPokemon(p)}>
                <img src={p.sprites.front_default} alt={p.name} class="h-25 w-25 mb-0.2" />
                <h2 class="capitalize font-bold">{p.name}</h2>
                <p >#{p.id}</p>
                <div class="flex space-x-2 mt-2">
                  {#each p.types as t}
                    <span class="px-3 py-1 text-xs rounded bg-yellow-200 text-black">{t}</span>
                  {/each}
                </div>
                <!-- Heart Button -->
                <Heartbutton pokemonId={p.id}/>
              </div>
        {/each}
    </div>
    {/if}
</div>

<!--Selected pokemon Details Grid-->
{#if selectedPokemon}
  <div class="fixed inset-0 flex justify-center items-center bg-red-100">
    <div class="relative w-full p-6 bg-black/50 border max-w-lg">
      <!-- svelte-ignore event_directive_deprecated -->
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
        <Heartbutton pokemonId={selectedPokemon.id}/>
    </div>
  </div>
{/if}