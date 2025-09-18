<script lang='ts'>
    import {auth,googleProvider} from "$lib/firebase";
    import {createUserWithEmailAndPassword,signInWithPopup,updateProfile} from "firebase/auth";
    import {goto} from "$app/navigation";

    let userName=$state("");
    let email=$state("");
    let password=$state("");
    let errorMessage=$state("");

// SignUp with mail and password

    async function handleSignup(e:Event) {
        e.preventDefault();
        errorMessage="";
        try{
            const userCredential=await createUserWithEmailAndPassword(auth,email,password);
            await updateProfile(userCredential.user,{displayName:userName});
            console.log("SignUp Successful",userCredential.user);
            goto("/dashboard");
        }catch(error:any){
            errorMessage=error.message;
            console.error("Failed to Signup",error);
        }
    }
// SignUp with Google

    async function handleGoogleSignup() {
        errorMessage="";
        try {
            const google=await signInWithPopup(auth,googleProvider);
            console.log("Google SignUp Successful",google.user);
            goto("/dashboard");
        } catch (error:any) {
            errorMessage=error.message;
            console.error("Google SignUp error",error);
        }
        
    }
</script>

<nav class="flex justify-between px-6 py-3 items-center absolute top-0 left-0 bg-black w-full text-white">
    <h2 class="font-extrabold text-xl">POKEDEX</h2>
    <div class="space-x-6">
        <a href="/" class="hover:text-yellow-300">Home</a>
        <a href="/login" class="hover:text-yellow-300">Login</a>
    </div>  
</nav>
<div class="flex justify-center h-screen items-center bg-cover bg-center" style="background-image: url('https://images8.alphacoders.com/134/1349281.png');">
    <div class="bg-white/50 border rounded-xl p-8 shadow-lg w-full max-w-lg">
        <h1 class="text-2xl font-bold text-center mb-6">Create an Account</h1>
        <!-- svelte-ignore event_directive_deprecated -->
        <form class="space-y-4" on:submit={handleSignup}>
            <input
            type="text"
            placeholder="Username"
            bind:value={userName}
            class="w-full rounded-xl"
            />
            <input
            type="email"
            placeholder="Email"
            bind:value={email}
            class="w-full rounded-xl"
            />
            <input
            type="password"
            placeholder="Password"
            bind:value={password}
            class="w-full rounded-xl"
            />
            <button class="w-full rounded-xl border hover:bg-green-600 font-medium py-3" >SignUp</button>
        </form>
        
        <p class="mt-3 text-center font-medium">Or</p>

        <!-- svelte-ignore event_directive_deprecated -->
        <button on:click={handleGoogleSignup} class="mt-3 border w-full bg-blue-500 rounded-xl hover:bg-red-500 font-medium py-3">SignIn with Google</button>

        {#if errorMessage}
        <p class="font-medium text-red-500 text-center">{errorMessage}</p>
        {/if}
        
    </div>

</div>

