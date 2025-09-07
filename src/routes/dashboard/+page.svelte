<script lang="ts">
    import {auth,db}  from "$lib/firebase";
    import {signOut,onAuthStateChanged,updateProfile} from "firebase/auth";
    import {doc,setDoc,getDoc} from "firebase/firestore";
    import {goto} from "$app/navigation";
    import {onMount,onDestroy} from "svelte";

    //variable declaration
    let userName="user";
    let profilePhoto:string|null=null;
    let dropdownOpen=false;
    let loading=true;
    let unsubscribeAuth:(()=>void)|null=null;

    let pokemons:any[]=[];
    let error:string|null=null;

    //Profile dropdown control
    function handleDropdown(){
        dropdownOpen=!dropdownOpen;
    }

    //First Letter for Profile
    $: firstLetter=userName.charAt(0).toUpperCase();

    //Image select + Save + Upload
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

    //Profile dropdown close
    async function handleDropdownClose(e:MouseEvent) {
        const dropdown=document.getElementById("profile-dropdown");
        const button=document.getElementById("profile-button");
        if(dropdown&&button&&!dropdown.contains(e.target as Node)&&!button.contains(e.target as Node)){
            dropdownOpen=false;
        }
    }

    //Load Profile
    onMount(()=>{
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
    });

    //LogOut
    async function handleLogout() {
        try {
            await signOut(auth);
            goto("/login");
        } catch (error) {
            console.error("Logout error:",error);
        }
    }
    onDestroy(()=>{
        if(unsubscribeAuth) unsubscribeAuth();
            document.removeEventListener("click",handleDropdownClose);
    });

    //Fetch Pkemons Dataset
    async function fetchPokemons() {
    loading = true;
    error = null;
    try {
      const res = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1000");
      if (!res.ok) throw new Error("Failed to fetch Pokémon list");
      const data = await res.json();

      const detailed = await Promise.all(
        data.results.map(async (p: any) => {
          const r = await fetch(p.url);
          return await r.json();
        })
      );
      pokemons = detailed;
    } catch (err: any) {
      error = err.message;
    } finally {
      loading = false;
    }
  }


</script>
<nav class="flex justify-between items-center px-6 py-3 absolute top-0 left-0 w-full bg-black text-white">
    <h1 class="font-extrabold text-xl">POKEDEX</h1>
    <div class="flex items-center space-x-6">
        <a href="#" class="hover:text-yellow-300 text-medium">Pokemon</a>
        <a href="#" class="hover:text-yellow-300 text-medium">Favoirites</a>
        <a href="#" class="hover:text-yellow-300 text-medium">About Us</a>

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
<div class="p-4 mt-20">
    {#if error}
    <h class="text-red-500 font-bold">{error}</h>
    {:else if loading}
    <h class="text-black-500 font-bold text-center">Loading Pokemons.....</h>
    {:else}
    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {#each pokemons as p }
            <div class="bg-black/60 flex flex-col items-center text-white hover:scale-105 rounded-xl p-4 mt-2 transition">
                <img src={p.sprites.front_default} alt={p.name} class="h-20 w-20 mb-0.2" />
                <h2 class="capitalize font-bold">{p.name}</h2>
                <p >#{p.id}</p>
                <div class="flex space-x-2 mt-2">
                    {#each p.types as t}
                        <span class="px-2 py-1 text-xs rounded bg-yellow-200 text-black">{t.type.name}</span>                        
                    {/each}
                </div>
            </div>
        {/each}
    </div>
    {/if}
</div>