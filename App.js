/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from 'react';
import {
  StyleSheet, Text, View, StatusBar, Platform, Button, TextInput
  , AsyncStorage, ScrollView, FlatList, Image, TouchableOpacity, ToastAndroid, Alert,
} from 'react-native';

//高さの判定をして値を設定
const STATUSBAR_HEIGHT = Platform.OS == "ios" ? 20 : StatusBar.currentHeight;

//PRICEを保存するkey/valueストアのキーを定義
const PRICE = "@todoapp.price"
//USERを保存するkey/valueストアのキーを定義
const USER = "@user.price"

//投稿した部分のfunction Conponent 
const Contribution = (props) => {
  toImagePath = imagePath(props.to)
  fromImagePath = imagePath(props.from)
  return (
    <TouchableOpacity onLongPress={props.longPress} >
      <View style={styles.contribution_image}>
        <View style={styles.contribution_item}>
          <Image source={fromImagePath}
            style={styles.image}
          />
          <Text>{props.user[props.from].username}</Text></View>
        <Text>→</Text>
        <View style={styles.contribution_item}>
          <Image source={toImagePath}
            style={styles.image}
          />
          <Text>{props.user[props.to].username}</Text></View>
      </View>
      <Text>{props.priceText}</Text>
      <View style={styles.contribution_Applause}>
        <Text>{props.applause}</Text>
        <Button
          onPress={props.plusApplause}
          title="いいね"
        />
        <Text>{props.date}</Text>
      </View>
    </TouchableOpacity>
  )
}

//画像のパスを返す
imagePath = (id) => {
  let imagePath
  switch (id) {
    case -1:
      imagePath = require("./img/0_image.png"); break
    case 0:
      imagePath = require("./img/1_image.png"); break
    case 1:
      imagePath = require("./img/2_image.png"); break
    case 2:
      imagePath = require("./img/3_image.png"); break
  }
  return imagePath
}

/*
ユーザー  
[userid:ID, username:名前, applause:拍手できる残数, applaused:拍手された回数]
投稿
[priceID:ID, to:紹介されるID, from:紹介するID, priceText:紹介する内容, applause:拍手された回数
  , date:紹介した日時, applauseUserId:[拍手したID]]
*/

export default class App extends React.Component {
  //コンストラクタを定義
  constructor(props) {
    super(props);
    var user = []
    //ユーザーが保存されているか判定し、保存されていなかったら保存
    this.checkUser()
    this.state = {
      price: [],
      user: user,
      currentUserId: 0,
      selectUserId: -1,
      inputText: "",
      currentPriceID: 0,
      //uerデータが入っているかのフラッグ
      loadconp: false,
    }
  }

  //ユーザーが保存されているか判定し、保存されていなかったら保存
  checkUser = async () => {
    try {
      const userString = await AsyncStorage.getItem(USER)
      let user = JSON.parse(userString)
      if (user == null) {
        const userid = [0, 1, 2,]
        const username = ["田中", "佐藤", "鈴木"]
        user = [{ userid: userid[0], username: username[0], applause: 100, applaused: 0, },
        { userid: userid[1], username: username[1], applause: 100, applaused: 0, },
        { userid: userid[2], username: username[2], applause: 100, applaused: 0, }]
      }
      this.saveUser(user)
    } catch (e) {
      console.log(e)
    }
  }

  saveUser = async (user) => {
    try {
      ToastAndroid.show("お待ちください", ToastAndroid.SHORT);
      const userString = JSON.stringify(user)
      await AsyncStorage.setItem(USER, userString)
      this.setState({
        loadconp: true,
        user: user,
      })
    } catch (e) {
      console.log(e)
    }
  }

  loadUser = async () => {
    try {
      ToastAndroid.show("お待ちください", ToastAndroid.SHORT);
      const userString = await AsyncStorage.getItem(USER)
      const user = JSON.parse(userString)
      this.setState({ user: user })
    } catch (e) {
      console.log(e)
    }
  }

  changeCurrentUser = () => {
    let currentUserId = this.state.currentUserId
    if (currentUserId <= 1) {
      currentUserId++
    } else {
      currentUserId = 0
    }
    this.setState({ currentUserId: currentUserId })
  }

  changeSelectUser = () => {
    let selectUserId = this.state.selectUserId
    if (selectUserId <= 1) {
      selectUserId++
    } else {
      selectUserId = 0
    }
    this.setState({ selectUserId: selectUserId })
  }

  loadPrice = async () => {
    try {
      const priceString = await AsyncStorage.getItem(PRICE)
      if (priceString) {
        const price = JSON.parse(priceString)
        const currentPriceID = price.length
        this.setState({ price: price, currentPriceID: currentPriceID })
      }
    } catch (e) {
      console.log(e)
    }
  }

  //投稿したものを追加
  onAddPrice = () => {
    //賞賛する相手を選んでいなかったらreturn
    if (this.state.selectUserId < 0) { return }
    const price_text = this.state.inputText
    //テキストが5文字未満の場合return
    if (price_text.length < 5) {
      return
    }
    let time = new Date()
    let date = time.toLocaleDateString() + " " + time.toLocaleTimeString()
    const priceID = this.state.currentPriceID + 1
    const newPrice = {
      priceID: priceID, to: this.state.selectUserId,
      from: this.state.currentUserId, priceText: price_text,
      applause: 0, date: date, applauseUserId: []
    }
    const price = [...this.state.price, newPrice]
    this.setState({
      price: price,
      currentPriceID: priceID,
      inputText: ""
    })
    this.savePrice(price)
  }

  //いいねボタンを押したときの処理
  plusApplause = (item) => {
    let user = this.state.user
    let currentUserId = this.state.currentUserId
    let toUserId = item.to
    let froumId = item.from
    //紹介された人、紹介した人はreturn
    if (currentUserId == toUserId || currentUserId == froumId) {
      return
    }
    //現在のユーザーが拍手できる残数があるか判定
    if (user[currentUserId].applause > 0) {
      //投稿に対して同じ人が15回拍手していたらreturn
      if (this.count(currentUserId, item.applauseUserId) < 15) {
        const price = this.state.price
        const index = price.indexOf(item)
        item.applauseUserId[item.applauseUserId.length] = currentUserId
        item.applause++

        user[currentUserId].applause = user[currentUserId].applause - 2
        user[toUserId].applaused++
        user[froumId].applaused++

        price[index] = item
        this.setState({ user: user, price: price })
        this.savePrice(price)
        this.saveUser(user)
      }else { return}
    } else { return }
  }

  //投稿を長押しした時トーストでいいねした人と回数を表示
  longPress = (item) => {
    let user = this.state.user
    let data = []
    let alert_text = ""
    //拍手したユーザー、拍手した回数を連想配列に入れる
    for (let i = 0; i < user.length; i++) {
      let count = this.count(i, item.applauseUserId)
      data[i] = { username: user[i].username, count: count }
    }
    //拍手した回数が多い順番にソート
    data.sort(function(a, b) { return (a.count < b.count ? 1 : -1) });
    for (let i = 0; i < data.length; i++) {
      alert_text+=data[i].username+" "+data[i].count+"\n"
     }
    Alert.alert("拍手の詳細", alert_text)
  }

  //いいねした回数を返す
  count = (x, array) => {
    let count = 0
    for (let index = 0; index < array.length; index++) {
      if (array[index] == x) {
        count++
      }
    }
    return count
  }

  savePrice = async (price) => {
    try {
      const priceString = JSON.stringify(price)
      await AsyncStorage.setItem(PRICE, priceString)
    } catch (e) {
      console.log(e)
    }
  }

  //画像のパスを返す
  imagePath = (id) => {
    let imagePath
    switch (id) {
      case -1:
        imagePath = require("./img/0_image.png"); break
      case 0:
        imagePath = require("./img/1_image.png"); break
      case 1:
        imagePath = require("./img/2_image.png"); break
      case 2:
        imagePath = require("./img/3_image.png"); break
    }
    return imagePath
  }

  //コンポーネントがマウントされた段階で読み込みを行う  
  componentDidMount() {
    this.loadPrice()
    this.loadUser()
  }

  render() {
    let price = this.state.price
    let user = this.state.user
    let currentUserId = this.state.currentUserId
    let selectUserId = this.state.selectUserId
    let currentImagePath = this.imagePath(currentUserId)
    let selectImagePath = this.imagePath(selectUserId)
    //userデーターがなかったらuserデータが入るまで「お待ちください」を表示
    if (!this.state.loadconp) { return <Text style={styles.container}>お待ちください</Text> }
    //userデータがあったら表示
    return (
      <View style={styles.container} behavior="padding">
        {/* ヘッダー */}
        <TouchableOpacity onPress={this.changeCurrentUser} style={styles.header}>
          <View style={styles.header_name}>
            <Image source={currentImagePath}
              style={styles.image}
            />
            <Text>{user[currentUserId].username}</Text>
          </View>
          <Text style={styles.header_applause}>拍手できる：{user[currentUserId].applause}</Text>
          <Text style={styles.header_applause}>拍手された：{user[currentUserId].applaused}</Text>
        </TouchableOpacity>
        {/* 入力部分 */}
        <View style={styles.inputView}>
          <Text>あなたの仲間の行動を紹介しよう</Text>
          <TouchableOpacity onPress={this.changeSelectUser} >
            <Image source={selectImagePath}
              style={{ width: 66, height: 50 }}
            />

          </TouchableOpacity>
          <TextInput
            onChangeText={(text) => this.setState({ inputText: text })}
            value={this.state.inputText}
          />
          <Button
            onPress={this.onAddPrice}
            title="紹介する"
            color="#841584"
          />
        </View>
        {/* 投稿された部分 */}
        <ScrollView style={styles.contribution}>
          <FlatList data={price}
            extraData={this.state}
            renderItem={({ item }) =>
              <Contribution
                user={this.state.user}
                to={item.to}
                from={item.from}
                date={item.date}
                priceText={item.priceText}
                applause={item.applause}
                plusApplause={() => this.plusApplause(item)}
                longPress={() => this.longPress(item)}
              />
            }
            keyExtractor={(item) => "price_" + item.priceID}
          />
        </ScrollView>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    //paddingTopの指定
    paddingTop: STATUSBAR_HEIGHT,
  },
  header: {
    height: '10%',
    flexDirection: "row",
    alignItems: 'center',
  },
  header_name: {
    flexDirection: "column",
  },
  header_applause: {
    flex: 1,
  },
  inputView: {
    height: '30%',
    flexDirection: "column"
  },
  inputView_input: {
    flexDirection: "column"
  },
  contribution: {
    flex: 2,
  },
  contribution_item: {
    flexDirection: "column",
  },
  contribution_image: {
    flexDirection: "row",
  },
  contribution_Applause: {
    flexDirection: "row",
  },
  image: {
    width: 60,
    height: 50,
  }
});