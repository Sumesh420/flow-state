import { useState,useEffect,useCallback } from "react";
import { useDebounceValue } from "usehooks-ts";
import { useUser } from "@clerk/nextjs";
import { Todo } from "@prisma/client";

function Dashboard(){
    const {user}=useUser();
    const [todos,setTodos]=useState<Todo[]>([]);
    const [searchTerm,setSearchTerm]=useState("");
    const [loading,setLoading]=useState(false);
    const [totalPages,setTotalPages]=useState();
    const [currentPage,setCurrentPage]=useState(1);
    const [isSubscribed,setIsSubscribed]=useState();
    

    const [debouncedSearchTerm]=useDebounceValue(searchTerm,300);
    const fetchTodos=useCallback(async(page:number)=>{
        try {
            setLoading(true);
            const response=await fetch(`/api/todos?page=${page}&search=${debouncedSearchTerm}`);
             if(!response.ok){
                console.log("Error fetching todos ")
            }
            const data=await response.json();
            setTodos(data.todos)
            setTotalPages(data.totalPages);
            setCurrentPage(data.currentPage);
            setLoading(false);
        } catch (error:any) {
            setLoading(false);
            console.log(error);
        }
    },[debouncedSearchTerm]);
    useEffect(()=>{
       fetchTodos(1);
       fetchSubscriptionStatus();
    },[]);
    const fetchSubscriptionStatus=async()=>{
        try {
           const response= await fetch("/api/subscription");
           if(response.ok){
            console.log("Error fetching subscription status");
             const data=await response.json();
           setIsSubscribed(data.isSubscribed);
           }
       
        } catch (error:any) {
            throw new Error("Error fetching Subscription status",error);
        }
    }
    const handleAddTodo=async(title:string)=>{
        try {
            const response=await fetch("/api/todos",{
                method:"POST",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({title})
            });
            if(!response.ok){
                throw new Error("Failed to add todo");
            }
            await fetchTodos(currentPage);

        } catch (error) {
            console.log("Error happened adding todo",error);
        }
    }
    const handleUpdateTodo=async(id:string,completed:boolean)=>{
        try {
            const response=await fetch(`api/todos/${id}`,{
                method:"PUT",
                headers:{"Content-Type":"application/json"},
                body:JSON.stringify({completed})
            });
            if(!response.ok){
                throw new Error("Failed to update todo");
            }
            await fetchTodos(currentPage);
        } catch (error:any) {
            console.log("Error happend updating todo",error);
        }
    }
    const handleDeleteTodo=async(id:string)=>{
        try {
            const response=await fetch(`/api/todos/${id}`,{
                method:"DELETE"
            });
            if(!response.ok){
                throw new Error("Error deleting todo");
            }
            await fetchTodos(currentPage);
        } catch (error:any) {
            console.log("Error happend deleting the todo",error)
        }
    }
}