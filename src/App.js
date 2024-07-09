import Container from "@mui/material/Container";
import {Routes, Route} from "react-router-dom";
import {useDispatch, useSelector} from "react-redux";
import {Header, Post} from "./components";
import { Home, FullPost, Registration, AddPost, Login} from "./pages";
import {fetchAuthMe, selectIsAuth} from "./redux/slices/auth";
import React from "react";
import {TagsPage} from "./pages/TagsPage";
import {UserProfile} from "./pages/Profile/Profile";
import SubscriptionsOrSubscribersPage from "./pages/SubsPage";
import AllUsersPage from "./pages/AllUsers";
import NotFound from "./pages/NotFound/NotFound";

function App() {
    const dispatch = useDispatch();
    const isAuth = useSelector(selectIsAuth);
    React.useEffect(() => {
        dispatch(fetchAuthMe());
    }, [])
  return (
    <>
      <Header />
      <Container maxWidth="lg">
          <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile/:id" element={<UserProfile />} />
              <Route path="/profile/:id/:group" element={<SubscriptionsOrSubscribersPage />} />
              <Route path="/users" element={<AllUsersPage />} />
              <Route path="/tags/:id" element={<TagsPage />} />
              <Route path="/posts/:id" element={<FullPost/>}/>
              <Route path="/posts/:id/edit" element={<AddPost/>}/>
              <Route path="/add-post" element={<AddPost/>}/>
              <Route path="/login" element={<Login/>}/>
              <Route path="/register" element={<Registration/>}/>
              <Route path="*" element={<NotFound />} />
          </Routes>

      </Container>
    </>
  );
}

export default App;
